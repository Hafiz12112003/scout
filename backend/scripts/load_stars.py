"""
Adds curated star players from La Liga, Bundesliga and Ligue 1 (and their
reported agents) on top of the Premier League data. Does NOT wipe the database.
Current clubs: official 2026/27 squad lists. Market values are approximate.
Agent links are publicly reported relationships, flagged source="reported".
Run from backend/ AFTER load_pl_data.py: py scripts\\load_stars.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from db import run_query, verify_connection, close_driver

LEAGUE_OF = {
    "Real Madrid": "La Liga", "FC Barcelona": "La Liga", "Atlético de Madrid": "La Liga",
    "Villarreal CF": "La Liga", "Sevilla FC": "La Liga", "Valencia CF": "La Liga",
    "Real Betis Balompié": "La Liga", "UD Las Palmas": "La Liga",
    "FC Bayern Munich": "Bundesliga", "Borussia Dortmund": "Bundesliga", "RB Leipzig": "Bundesliga",
    "Bayer 04 Leverkusen": "Bundesliga", "VfB Stuttgart": "Bundesliga", "SV Werder Bremen": "Bundesliga",
    "FC Schalke 04": "Bundesliga",
    "Paris Saint-Germain": "Ligue 1", "AS Monaco": "Ligue 1", "OGC Nice": "Ligue 1",
    "Olympique Lyon": "Ligue 1", "LOSC Lille": "Ligue 1",
    "Juventus FC": "Serie A", "Inter Milan": "Serie A", "SSC Napoli": "Serie A", "AS Roma": "Serie A",
    "AC Milan": "Serie A",
}


def S(name, pos, nat, born, value_m, history):
    return {"name": name, "position": pos, "nationality": nat, "birth_year": born,
            "market_value": int(value_m * 1_000_000), "history": history}


STARS = [
    # --- Real Madrid ---
    S("Kylian Mbappé", "Forward", "France", 1998, 150, [("AS Monaco", 2015), ("Paris Saint-Germain", 2017), ("Real Madrid", 2024)]),
    S("Vinícius Júnior", "Forward", "Brazil", 2000, 150, [("CR Flamengo", 2017), ("Real Madrid", 2018)]),
    S("Jude Bellingham", "Midfielder", "England", 2003, 160, [("Birmingham City", 2019), ("Borussia Dortmund", 2020), ("Real Madrid", 2023)]),
    S("Federico Valverde", "Midfielder", "Uruguay", 1998, 120, [("Real Madrid", 2016)]),
    S("Thibaut Courtois", "Goalkeeper", "Belgium", 1992, 40, [("KRC Genk", 2009), ("Chelsea FC", 2011), ("Real Madrid", 2018)]),
    S("Aurélien Tchouaméni", "Midfielder", "France", 2000, 80, [("AS Monaco", 2020), ("Real Madrid", 2022)]),
    S("Eduardo Camavinga", "Midfielder", "France", 2002, 70, [("Real Madrid", 2021)]),
    S("Arda Güler", "Midfielder", "Turkey", 2005, 80, [("Real Madrid", 2023)]),
    S("Dean Huijsen", "Defender", "Spain", 2005, 60, [("Juventus FC", 2023), ("AFC Bournemouth", 2024), ("Real Madrid", 2025)]),
    S("Trent Alexander-Arnold", "Defender", "England", 1998, 60, [("Liverpool FC", 2016), ("Real Madrid", 2025)]),
    S("Ibrahima Konaté", "Defender", "France", 1999, 45, [("RB Leipzig", 2017), ("Liverpool FC", 2021), ("Real Madrid", 2026)]),
    S("Marc Cucurella", "Defender", "Spain", 1998, 45, [("Brighton & Hove Albion", 2021), ("Chelsea FC", 2022), ("Real Madrid", 2026)]),
    S("Denzel Dumfries", "Defender", "Netherlands", 1996, 25, [("PSV Eindhoven", 2016), ("Inter Milan", 2021), ("Real Madrid", 2026)]),
    S("Bernardo Silva", "Midfielder", "Portugal", 1994, 50, [("AS Monaco", 2014), ("Manchester City", 2017), ("Real Madrid", 2026)]),
    S("Rodrygo", "Forward", "Brazil", 2001, 80, [("Santos FC", 2017), ("Real Madrid", 2019)]),
    S("Éder Militão", "Defender", "Brazil", 1998, 40, [("FC Porto", 2018), ("Real Madrid", 2019)]),
    S("Antonio Rüdiger", "Defender", "Germany", 1993, 20, [("AS Roma", 2015), ("Chelsea FC", 2017), ("Real Madrid", 2022)]),
    S("Endrick", "Forward", "Brazil", 2006, 40, [("Sociedade Esportiva Palmeiras", 2022), ("Real Madrid", 2024)]),
    # --- FC Barcelona ---
    S("Lamine Yamal", "Forward", "Spain", 2007, 200, [("FC Barcelona", 2023)]),
    S("Pedri", "Midfielder", "Spain", 2002, 140, [("UD Las Palmas", 2019), ("FC Barcelona", 2020)]),
    S("Raphinha", "Forward", "Brazil", 1996, 70, [("Sporting CP", 2018), ("Leeds United", 2020), ("FC Barcelona", 2022)]),
    S("Rodri", "Midfielder", "Spain", 1996, 110, [("Villarreal CF", 2018), ("Atlético de Madrid", 2018), ("Manchester City", 2019), ("FC Barcelona", 2026)]),
    S("Anthony Gordon", "Forward", "England", 2001, 75, [("Everton FC", 2017), ("Newcastle United", 2023), ("FC Barcelona", 2026)]),
    S("Karim Adeyemi", "Forward", "Germany", 2002, 40, [("Red Bull Salzburg", 2020), ("Borussia Dortmund", 2022), ("FC Barcelona", 2026)]),
    S("Gabriel Jesus", "Forward", "Brazil", 1997, 25, [("Sociedade Esportiva Palmeiras", 2015), ("Manchester City", 2017), ("Arsenal FC", 2022), ("FC Barcelona", 2026)]),
    S("Frenkie de Jong", "Midfielder", "Netherlands", 1997, 55, [("Ajax Amsterdam", 2015), ("FC Barcelona", 2019)]),
    S("Jules Koundé", "Defender", "France", 1998, 65, [("FC Girondins Bordeaux", 2018), ("Sevilla FC", 2019), ("FC Barcelona", 2022)]),
    S("Dani Olmo", "Midfielder", "Spain", 1998, 55, [("GNK Dinamo Zagreb", 2014), ("RB Leipzig", 2020), ("FC Barcelona", 2024)]),
    S("Gavi", "Midfielder", "Spain", 2004, 50, [("FC Barcelona", 2021)]),
    S("Pau Cubarsí", "Defender", "Spain", 2007, 80, [("FC Barcelona", 2023)]),
    S("Fermín López", "Midfielder", "Spain", 2003, 50, [("FC Barcelona", 2023)]),
    # --- FC Bayern Munich ---
    S("Harry Kane", "Forward", "England", 1993, 90, [("Tottenham Hotspur", 2009), ("FC Bayern Munich", 2023)]),
    S("Michael Olise", "Forward", "France", 2001, 141, [("Reading FC", 2019), ("Crystal Palace", 2021), ("FC Bayern Munich", 2024)]),
    S("Luis Díaz", "Forward", "Colombia", 1997, 80, [("FC Porto", 2019), ("Liverpool FC", 2022), ("FC Bayern Munich", 2025)]),
    S("Jamal Musiala", "Midfielder", "Germany", 2003, 105, [("Chelsea FC", 2011), ("FC Bayern Munich", 2019)]),
    S("Joshua Kimmich", "Midfielder", "Germany", 1995, 60, [("VfB Stuttgart", 2013), ("RB Leipzig", 2015), ("FC Bayern Munich", 2015)]),
    S("Alphonso Davies", "Defender", "Canada", 2000, 40, [("Vancouver Whitecaps FC", 2016), ("FC Bayern Munich", 2019)]),
    S("Dayot Upamecano", "Defender", "France", 1998, 50, [("RB Leipzig", 2017), ("FC Bayern Munich", 2021)]),
    S("Jonathan Tah", "Defender", "Germany", 1996, 30, [("Bayer 04 Leverkusen", 2015), ("FC Bayern Munich", 2025)]),
    S("Kim Min-jae", "Defender", "South Korea", 1996, 35, [("SSC Napoli", 2022), ("FC Bayern Munich", 2023)]),
    S("Serge Gnabry", "Forward", "Germany", 1995, 15, [("Arsenal FC", 2012), ("SV Werder Bremen", 2016), ("FC Bayern Munich", 2017)]),
    S("Lennart Karl", "Midfielder", "Germany", 2008, 39, [("FC Bayern Munich", 2025)]),
    S("Leon Goretzka", "Midfielder", "Germany", 1995, 20, [("FC Schalke 04", 2013), ("FC Bayern Munich", 2018)]),
    S("Manuel Neuer", "Goalkeeper", "Germany", 1986, 3, [("FC Schalke 04", 2006), ("FC Bayern Munich", 2011)]),
    # --- Paris Saint-Germain ---
    S("Ousmane Dembélé", "Forward", "France", 1997, 90, [("Rennes", 2015), ("Borussia Dortmund", 2016), ("FC Barcelona", 2017), ("Paris Saint-Germain", 2023)]),
    S("Vitinha", "Midfielder", "Portugal", 2000, 90, [("FC Porto", 2019), ("Wolverhampton Wanderers", 2020), ("Paris Saint-Germain", 2022)]),
    S("João Neves", "Midfielder", "Portugal", 2004, 100, [("SL Benfica", 2022), ("Paris Saint-Germain", 2024)]),
    S("Désiré Doué", "Forward", "France", 2005, 80, [("Rennes", 2022), ("Paris Saint-Germain", 2024)]),
    S("Khvicha Kvaratskhelia", "Forward", "Georgia", 2001, 80, [("SSC Napoli", 2022), ("Paris Saint-Germain", 2025)]),
    S("Ferran Torres", "Forward", "Spain", 2000, 40, [("Valencia CF", 2017), ("Manchester City", 2020), ("FC Barcelona", 2022), ("Paris Saint-Germain", 2026)]),
    S("Marquinhos", "Defender", "Brazil", 1994, 25, [("AS Roma", 2012), ("Paris Saint-Germain", 2013)]),
    S("Achraf Hakimi", "Defender", "Morocco", 1998, 70, [("Real Madrid", 2016), ("Borussia Dortmund", 2018), ("Inter Milan", 2020), ("Paris Saint-Germain", 2021)]),
    S("Nuno Mendes", "Defender", "Portugal", 2002, 70, [("Sporting CP", 2019), ("Paris Saint-Germain", 2021)]),
    S("Warren Zaïre-Emery", "Midfielder", "France", 2006, 60, [("Paris Saint-Germain", 2022)]),
    S("Fabián Ruiz", "Midfielder", "Spain", 1996, 40, [("Real Betis Balompié", 2017), ("SSC Napoli", 2018), ("Paris Saint-Germain", 2022)]),
    S("Maghnes Akliouche", "Midfielder", "France", 2002, 45, [("AS Monaco", 2021), ("Paris Saint-Germain", 2026)]),
]

# Publicly reported representation (not verified by Scout). (player, agent, agency)
AGENTS = [
    ("Bernardo Silva", "Jorge Mendes", "Gestifute"),
    ("Vitinha", "Jorge Mendes", "Gestifute"),
    ("João Neves", "Jorge Mendes", "Gestifute"),
    ("Ruben Dias", "Jorge Mendes", "Gestifute"),
    ("Matheus Nunes", "Jorge Mendes", "Gestifute"),
    ("Kylian Mbappé", "Fayza Lamari", "Family representation"),
    ("Harry Kane", "Tony McGill", "Independent"),
]


def build_rows():
    players, stints, transfers = [], [], []
    for s in STARS:
        players.append({"name": s["name"], "props": {
            "position": s["position"], "nationality": s["nationality"], "birth_year": s["birth_year"],
            "market_value": s["market_value"], "value_source": "approximate", "source": "curated-2026"}})
        h = s["history"]
        for i, (club, start) in enumerate(h):
            end = h[i + 1][1] if i + 1 < len(h) else None
            stints.append({"player": s["name"], "club": club, "from_year": start, "to_year": end})
            if i > 0:
                transfers.append({"player": s["name"], "club": club, "year": start})
    return players, stints, transfers


def batch(cypher, rows, size=200):
    for i in range(0, len(rows), size):
        run_query(cypher, {"rows": rows[i:i + size]})


def main():
    ok, message = verify_connection()
    if not ok:
        print(f"Cannot connect: {message}")
        sys.exit(1)
    players, stints, transfers = build_rows()
    clubs = sorted({s["club"] for s in stints})
    print(f"{len(players)} stars, {len(clubs)} clubs, {len(stints)} stints")

    batch("UNWIND $rows AS row MERGE (c:Club {name: row.name})", [{"name": c} for c in clubs])
    batch("""UNWIND $rows AS row
             MATCH (c:Club {name: row.club}), (l:League {name: row.league})
             MERGE (c)-[:COMPETES_IN]->(l)""",
          [{"club": c, "league": LEAGUE_OF[c]} for c in clubs if c in LEAGUE_OF])
    batch("UNWIND $rows AS row MERGE (p:Player {name: row.name}) SET p += row.props", players)
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             MERGE (p)-[r:PLAYED_FOR]->(c)
             SET r.from_year = row.from_year, r.to_year = row.to_year""", stints)
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             MERGE (p)-[r:TRANSFERRED_TO]->(c)
             SET r.year = row.year""", transfers)

    linked = 0
    for player, agent, agency in AGENTS:
        run_query("MERGE (a:Agent {name: $agent}) SET a.agency = $agency", {"agent": agent, "agency": agency})
        res = run_query(
            """MATCH (p:Player {name: $player}), (a:Agent {name: $agent})
               MERGE (p)-[r:REPRESENTED_BY]->(a) SET r.source = 'reported'
               RETURN p.name AS name""",
            {"player": player, "agent": agent},
        )
        linked += len(res)
    print(f"Agent links created: {linked} of {len(AGENTS)} (missing players are skipped)")

    for row in run_query("MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY label"):
        print(f"  {row['label']}: {row['n']}")
    close_driver()


if __name__ == "__main__":
    main()