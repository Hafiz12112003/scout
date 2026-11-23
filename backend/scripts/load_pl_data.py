"""
Loads real Premier League 2026/27 data into the Scout graph.
Source: github.com/oladeeayo/pl-catalogue (non-commercial, attribution required).
Run from backend/: py scripts\\load_pl_data.py
"""
import csv
import os
import re
import sys
from collections import defaultdict

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from dotenv import load_dotenv
load_dotenv()

from db import run_query, verify_connection, close_driver

DATA = os.path.join(BACKEND, "data")

PL_CLUBS = {
    "Arsenal": "Arsenal FC", "Aston Villa": "Aston Villa", "Bournemouth": "AFC Bournemouth",
    "Brentford": "Brentford FC", "Brighton": "Brighton & Hove Albion", "Chelsea": "Chelsea FC",
    "Coventry City": "Coventry City", "Crystal Palace": "Crystal Palace", "Everton": "Everton FC",
    "Fulham": "Fulham FC", "Hull City": "Hull City", "Ipswich Town": "Ipswich Town",
    "Leeds": "Leeds United", "Liverpool": "Liverpool FC", "Man City": "Manchester City",
    "Man Utd": "Manchester United", "Newcastle": "Newcastle United",
    "Nott'm Forest": "Nottingham Forest", "Spurs": "Tottenham Hotspur", "Sunderland": "Sunderland AFC",
}
POSITIONS = {"GKP": "Goalkeeper", "DEF": "Defender", "MID": "Midfielder", "FWD": "Forward"}
LEAGUES = [
    {"name": "Premier League", "country": "England", "tier": 1},
    {"name": "La Liga", "country": "Spain", "tier": 1},
    {"name": "Bundesliga", "country": "Germany", "tier": 1},
    {"name": "Ligue 1", "country": "France", "tier": 1},
    {"name": "Serie A", "country": "Italy", "tier": 1},
]
YOUTH = re.compile(r"( U\d\d| Youth| Academy| II$| B$)")


def read(name):
    with open(os.path.join(DATA, name), encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def num(x):
    try:
        return float(x) if x not in ("", None) else None
    except ValueError:
        return None


def whole(x):
    v = num(x)
    return int(v) if v is not None else None


def year(s):
    return int(s[:4]) if s and len(s) >= 4 and s[:4].isdigit() else None


def batch(cypher, rows, size=200):
    for i in range(0, len(rows), size):
        run_query(cypher, {"rows": rows[i:i + size]})


def build_players():
    players, tm_to_name, used = [], {}, set()
    for r in read("players.csv"):
        name = (r["tm_name"] or "").strip() or (r["full_name"] or "").strip() \
            or f"{r['first_name']} {r['second_name']}".strip()
        if name in used:
            name = f"{name} ({r['team']})"
        used.add(name)
        club = PL_CLUBS.get(r["team"])
        if not club:
            continue
        tm = whole(r["tm_id"]) or whole(r["key_transfermarkt"])
        if tm:
            tm_to_name[tm] = name
        players.append({
            "name": name, "club": club, "tm_id": tm, "joined": year(r["joined_date"]),
            "props": {
                "position": POSITIONS.get(r["position"], r["position"]),
                "position_detail": r["position_detail"] or None,
                "nationality": r["nationality"] or None,
                "birth_year": year(r["date_of_birth"]),
                "market_value": whole(r["market_value_eur"]),
                "contract_until": r["contract_until"] or None,
                "height_cm": num(r["height_cm"]),
                "foot": r["foot"] or None,
                "minutes": whole(r["season_minutes"]),
                "goals": whole(r["season_goals"]),
                "assists": whole(r["season_assists"]),
                "xg": num(r["season_xg"]),
                "xa": num(r["season_xa"]),
                "tm_id": tm,
                "source": "pl-catalogue",
            },
        })
    return players, tm_to_name


def build_stints(players, tm_to_name):
    moves = defaultdict(dict)
    for r in read("transfers.csv"):
        tm = whole(r["tm_id"])
        if tm not in tm_to_name:
            continue
        moves[tm][(int(r["saison_id"]), r["from_club"], r["to_club"])] = r

    stints, transfers = [], []
    for p in players:
        name, current = p["name"], p["club"]
        ms = sorted(moves.get(p["tm_id"], {}).items(), key=lambda kv: kv[0][0])
        chain = []  # (club, from_year)
        if ms:
            chain.append((ms[0][0][1], None))
        for (season, frm, to), r in ms:
            chain.append((to, season))
            transfers.append({
                "player": name, "club": to, "year": season,
                "fee": whole(r["fee_eur"]) or 0, "transfer_type": r["fee_type"] or "unknown",
            })
        if not chain or chain[-1][0] != current:
            chain.append((current, p["joined"]))
        for i, (club, start) in enumerate(chain):
            if YOUTH.search(club) or not club:
                continue
            end = chain[i + 1][1] if i + 1 < len(chain) else None
            stints.append({"player": name, "club": club, "from_year": start, "to_year": end})
    return stints, transfers


def main():
    ok, message = verify_connection()
    if not ok:
        print(f"Cannot connect: {message}")
        sys.exit(1)
    print(f"{message}\n")

    players, tm_to_name = build_players()
    stints, transfers = build_stints(players, tm_to_name)
    clubs = sorted({s["club"] for s in stints})
    pl_names = set(PL_CLUBS.values())
    print(f"{len(players)} players, {len(clubs)} clubs, {len(stints)} stints, {len(transfers)} transfers")

    print("Clearing existing data...")
    run_query("MATCH (n) DETACH DELETE n")
    for label in ("Player", "Club", "Agent", "Manager", "League"):
        run_query(f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.name IS UNIQUE")

    print("Loading leagues and clubs...")
    batch("UNWIND $rows AS row MERGE (l:League {name: row.name}) SET l.country = row.country, l.tier = row.tier", LEAGUES)
    club_rows = [{"name": c, "country": "England" if c in pl_names else None, "pl": c in pl_names} for c in clubs]
    batch("UNWIND $rows AS row MERGE (c:Club {name: row.name}) SET c.country = row.country", club_rows)
    run_query(
        "MATCH (c:Club) WHERE c.name IN $names MATCH (l:League {name: 'Premier League'}) MERGE (c)-[:COMPETES_IN]->(l)",
        {"names": sorted(pl_names)},
    )

    print("Loading players...")
    batch("UNWIND $rows AS row MERGE (p:Player {name: row.name}) SET p += row.props",
          [{"name": p["name"], "props": {k: v for k, v in p["props"].items() if v is not None}} for p in players])

    print("Loading career stints...")
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             MERGE (p)-[r:PLAYED_FOR]->(c)
             SET r.from_year = row.from_year, r.to_year = row.to_year""", stints)

    print("Loading transfers...")
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             MERGE (p)-[r:TRANSFERRED_TO]->(c)
             SET r.year = row.year, r.fee = row.fee, r.transfer_type = row.transfer_type""", transfers)

    for row in run_query("MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY label"):
        print(f"  {row['label']}: {row['n']}")
    for row in run_query("MATCH ()-[r]->() RETURN type(r) AS t, count(*) AS n ORDER BY t"):
        print(f"  {row['t']}: {row['n']}")
    print("\nDone. Data: pl-catalogue (github.com/oladeeayo/pl-catalogue)")
    close_driver()


if __name__ == "__main__":
    main()