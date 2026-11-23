"""
Trains the Scout value model and writes the results into the graph.

Task: predict a player's market value (log EUR) from age, position and recent performance
(last three seasons weighted toward recent form, plus the current season).
Models: Ridge regression baseline and an ensemble of small neural networks (MLPs).
Output in the graph, per player:   predicted_value, upside_pct, model_minutes
Output as relationships:           (Player)-[:SIMILAR_TO {score}]->(Player)  (neural embedding)
Output as a node:                  (ModelInfo {name: 'value-model'}) with the cross-validated metrics

Data: github.com/oladeeayo/pl-catalogue (Premier League only, so only those players get predictions).
Run from backend/:  py scripts\\train_value_model.py [path-to-pl-catalogue\\data\\2026-27]
"""
import glob
import os
import sys
import warnings
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.linear_model import RidgeCV
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from db import run_query, verify_connection, close_driver

DEFAULT_DIR = r"C:\projects\pl-catalogue\data\2026-27"
SEASON_WEIGHTS = {"2023/24": 0.5, "2024/25": 0.75, "2025/26": 1.0}
STATS = ["goals_scored", "assists", "expected_goals", "expected_assists", "ict_index", "bonus",
         "clean_sheets", "saves", "tackles", "defensive_contribution", "starts"]
MIN_MINUTES = 450      # weighted minutes needed to train on / report a prediction for a player
N_MLPS = 5
SIMILAR_K = 5


def build_features(data_dir):
    players = pd.read_csv(os.path.join(data_dir, "players.csv"))
    hist = pd.concat([pd.read_csv(f) for f in glob.glob(os.path.join(data_dir, "players", "*", "history.csv"))])
    hist = hist[hist.season_name.isin(SEASON_WEIGHTS)].copy()
    hist["w"] = hist.season_name.map(SEASON_WEIGHTS)
    for col in ["minutes"] + STATS:
        hist[col] = pd.to_numeric(hist[col], errors="coerce").fillna(0)

    agg = pd.DataFrame({"wmin": (hist.minutes * hist.w).groupby(hist.player_id).sum()})
    for s in STATS:
        agg["w_" + s] = (hist[s] * hist.w).groupby(hist.player_id).sum()

    df = players.merge(agg, left_on="player_id", right_index=True, how="left")
    df["wmin"] = df.wmin.fillna(0) + df.season_minutes.fillna(0)
    for col, cur in [("w_goals_scored", "season_goals"), ("w_assists", "season_assists"),
                     ("w_expected_goals", "season_xg"), ("w_expected_assists", "season_xa")]:
        df[col] = df[col].fillna(0) + df[cur].fillna(0)
    df["age"] = (pd.Timestamp("2026-11-23") - pd.to_datetime(df.date_of_birth)).dt.days / 365.25

    f = pd.DataFrame(index=df.index)
    f["age"] = df.age
    f["age_sq"] = df.age ** 2
    f["age_over_30"] = (df.age - 30).clip(lower=0)
    f["age_under_23"] = (23 - df.age).clip(lower=0)
    for pos in ["GKP", "DEF", "MID", "FWD"]:
        f["pos_" + pos] = (df.position == pos).astype(float)
    n90 = (df.wmin / 90).clip(lower=1)
    for s in STATS[:-1]:
        f["p90_" + s] = df["w_" + s].fillna(0) / n90
    f["log_minutes"] = np.log1p(df.wmin)
    f["start_rate"] = df.w_starts.fillna(0) / n90
    f = f.fillna(f.median())
    return df, f


class MLPEnsemble:
    """Small neural nets on standardised inputs and a standardised log-value target."""

    def __init__(self, n=N_MLPS):
        self.n = n

    def fit(self, X, y):
        self.sx, self.sy = StandardScaler().fit(X), StandardScaler().fit(y.reshape(-1, 1))
        Xs, ys = self.sx.transform(X), self.sy.transform(y.reshape(-1, 1)).ravel()
        self.models = [MLPRegressor(hidden_layer_sizes=(32, 16), alpha=0.1, max_iter=3000, random_state=s).fit(Xs, ys)
                       for s in range(self.n)]
        return self

    def predict(self, X):
        Xs = self.sx.transform(X)
        out = np.mean([m.predict(Xs) for m in self.models], axis=0)
        return self.sy.inverse_transform(out.reshape(-1, 1)).ravel()

    def embed(self, X):
        """16-d activations of the last hidden layer of the first network."""
        m = self.models[0]
        h = self.sx.transform(X)
        for W, b in zip(m.coefs_[:-1], m.intercepts_[:-1]):
            h = np.maximum(h @ W + b, 0)
        return h


class RidgeModel:
    def fit(self, X, y):
        self.sx = StandardScaler().fit(X)
        self.m = RidgeCV(alphas=np.logspace(-2, 3, 20)).fit(self.sx.transform(X), y)
        return self

    def predict(self, X):
        return self.m.predict(self.sx.transform(X))


def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR
    df, f = build_features(data_dir)
    eligible = df.wmin >= MIN_MINUTES
    train = eligible & df.market_value_eur.notna()
    X, y = f.values, np.log(df.market_value_eur.values.astype(float))
    idx = np.where(train)[0]
    print(f"{len(df)} players, {len(idx)} used for training (>= {MIN_MINUTES} weighted minutes and a market value)")

    # Out-of-fold predictions: every training player is scored by a model that never saw them.
    oof = {"ridge": np.zeros(len(idx)), "mlp": np.zeros(len(idx))}
    for tr, te in KFold(5, shuffle=True, random_state=0).split(idx):
        oof["ridge"][te] = RidgeModel().fit(X[idx[tr]], y[idx[tr]]).predict(X[idx[te]])
        oof["mlp"][te] = MLPEnsemble().fit(X[idx[tr]], y[idx[tr]]).predict(X[idx[te]])
    oof["blend"] = 0.5 * oof["ridge"] + 0.5 * oof["mlp"]
    metrics = {}
    for name, pred in oof.items():
        metrics[name] = (r2_score(y[idx], pred), mean_absolute_error(y[idx], pred))
        print(f"  5-fold CV  {name:6s} R2 = {metrics[name][0]:.3f}   MAE (log) = {metrics[name][1]:.3f}")

    ridge, mlp = RidgeModel().fit(X[idx], y[idx]), MLPEnsemble().fit(X[idx], y[idx])
    pred_log = 0.5 * ridge.predict(X) + 0.5 * mlp.predict(X)
    pred_log[idx] = oof["blend"]                       # honest (out-of-fold) value for training players
    df["pred_value"] = np.exp(pred_log)
    df["upside_pct"] = (df.pred_value / df.market_value_eur - 1) * 100

    show = eligible & df.market_value_eur.notna() & df.tm_id.notna()
    out = df[show]
    print("\nTop undervalued, age <= 28 and market value >= 5m (model value vs market value):")
    gems = out[(out.age <= 28) & (out.market_value_eur >= 5e6)]
    for _, r in gems.sort_values("upside_pct", ascending=False).head(8).iterrows():
        print(f"  {r.tm_name or r.web_name:28s} {r.team:14s} age {r.age:4.1f}  market {r.market_value_eur/1e6:5.1f}m  model {r.pred_value/1e6:5.1f}m  {r.upside_pct:+.0f}%")

    # Neural embeddings -> nearest neighbours within the same position group.
    emb = mlp.embed(X)
    emb = emb / (np.linalg.norm(emb, axis=1, keepdims=True) + 1e-9)
    sim_rows = []
    pool = df[eligible & df.tm_id.notna()]
    for pos, grp in pool.groupby("position"):
        ids = grp.index.values
        S = emb[ids] @ emb[ids].T
        for i, a in enumerate(ids):
            for j in np.argsort(-S[i])[1:SIMILAR_K + 1]:
                sim_rows.append({"a": int(df.tm_id[a]), "b": int(df.tm_id[ids[j]]), "score": round(float(S[i, j]), 4)})
    print(f"\n{len(sim_rows)} SIMILAR_TO links. Example neighbours:")
    for name in ["Erling Haaland", "Bukayo Saka", "Declan Rice"]:
        hit = df[df.tm_name == name]
        if len(hit):
            a = int(hit.tm_id.iloc[0])
            nb = [r["b"] for r in sim_rows if r["a"] == a]
            names = [df[df.tm_id == b].tm_name.iloc[0] for b in nb]
            print(f"  {name}: {', '.join(names)}")

    ok, message = verify_connection()
    if not ok:
        print(f"\nCannot connect to the database: {message}")
        sys.exit(1)
    rows = [{"tm": int(r.tm_id), "pv": int(r.pred_value), "up": round(float(r.upside_pct), 1), "mm": int(r.wmin)}
            for _, r in out.iterrows()]
    run_query("MATCH (p:Player) REMOVE p.predicted_value, p.upside_pct, p.model_minutes")
    for i in range(0, len(rows), 200):
        run_query("""UNWIND $rows AS row MATCH (p:Player {tm_id: row.tm})
                     SET p.predicted_value = row.pv, p.upside_pct = row.up, p.model_minutes = row.mm""",
                  {"rows": rows[i:i + 200]})
    run_query("MATCH ()-[r:SIMILAR_TO]->() DELETE r")
    for i in range(0, len(sim_rows), 200):
        run_query("""UNWIND $rows AS row MATCH (a:Player {tm_id: row.a}), (b:Player {tm_id: row.b})
                     MERGE (a)-[r:SIMILAR_TO]->(b) SET r.score = row.score""", {"rows": sim_rows[i:i + 200]})
    run_query("""MERGE (m:ModelInfo {name: 'value-model'})
                 SET m.trained_at = $ts, m.n_train = $n, m.min_minutes = $mm,
                     m.ridge_r2 = $r1, m.mlp_r2 = $r2, m.blend_r2 = $r3, m.blend_mae_log = $mae,
                     m.features = $features, m.data_source = 'github.com/oladeeayo/pl-catalogue'""",
              {"ts": datetime.now(timezone.utc).isoformat(), "n": int(len(idx)), "mm": MIN_MINUTES,
               "r1": round(metrics["ridge"][0], 3), "r2": round(metrics["mlp"][0], 3),
               "r3": round(metrics["blend"][0], 3), "mae": round(metrics["blend"][1], 3), "features": list(f.columns)})
    print(f"\nWrote predictions for {len(rows)} players, {len(sim_rows)} similarity links and the model card.")
    close_driver()


if __name__ == "__main__":
    main()