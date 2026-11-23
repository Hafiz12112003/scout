"""
Adds curated Serie A stars (Inter, Roma, Napoli, Juventus, Milan) and their head coaches.
Does NOT wipe the database. Run from backend/ after load_extras.py:
    py scripts\\load_serie_a.py
Current clubs and coaches come from official 2026/27 squad lists. Market values are approximate.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from db import run_query, verify_connection, close_driver

SERIE_A = ["Inter Milan", "AS Roma", "SSC Napoli", "Juventus FC", "AC Milan", "Atalanta BC", "Torino FC",
           "Genoa CFC", "Udinese Calcio", "US Sassuolo", "FC Empoli", "Parma Calcio 1913", "Cagliari Calcio",
           "Palermo FC"]


def S(name, pos, nat, born, value_m, history):
    return {"name": name, "position": pos, "nationality": nat, "birth_year": born,
            "market_value": int(value_m * 1_000_000), "history": history}


def M(name, nat, spells):
    return {"name": name, "nationality": nat, "spells": spells}


STARS = [
    # --- Inter Milan ---
    S("Lautaro Martínez", "Forward", "Argentina", 1997, 85, [("Racing Club", 2015), ("Inter Milan", 2018)]),
    S("Marcus Thuram", "Forward", "France", 1997, 60, [("EA Guingamp", 2017), ("Borussia Mönchengladbach", 2019), ("Inter Milan", 2023)]),
    S("Nicolò Barella", "Midfielder", "Italy", 1997, 50, [("Cagliari Calcio", 2015), ("Inter Milan", 2019)]),
    S("Hakan Çalhanoğlu", "Midfielder", "Turkey", 1994, 30, [("Bayer 04 Leverkusen", 2014), ("AC Milan", 2017), ("Inter Milan", 2021)]),
    S("Alessandro Bastoni", "Defender", "Italy", 1999, 70, [("Inter Milan", 2017)]),
    S("Piotr Zieliński", "Midfielder", "Poland", 1994, 15, [("Udinese Calcio", 2014), ("SSC Napoli", 2016), ("Inter Milan", 2024)]),
    S("Manuel Akanji", "Defender", "Switzerland", 1995, 30, [("FC Basel 1893", 2015), ("Borussia Dortmund", 2018), ("Manchester City", 2022), ("Inter Milan", 2025)]),
    S("John Stones", "Defender", "England", 1994, 20, [("Everton FC", 2013), ("Manchester City", 2016), ("Inter Milan", 2026)]),
    S("Curtis Jones", "Midfielder", "England", 2001, 35, [("Liverpool FC", 2019), ("Inter Milan", 2026)]),
    S("Luis Henrique", "Forward", "Brazil", 2001, 30, [("Botafogo de Futebol e Regatas", 2022), ("Olympique Marseille", 2024), ("Inter Milan", 2025)]),
    # --- AS Roma ---
    S("Mile Svilar", "Goalkeeper", "Serbia", 1999, 35, [("SL Benfica", 2018), ("AS Roma", 2023)]),
    S("Matías Soulé", "Forward", "Argentina", 2003, 45, [("Juventus FC", 2022), ("AS Roma", 2024)]),
    S("Paulo Dybala", "Forward", "Argentina", 1993, 8, [("Palermo FC", 2012), ("Juventus FC", 2015), ("AS Roma", 2022)]),
    S("Manu Koné", "Midfielder", "France", 2001, 40, [("Borussia Mönchengladbach", 2019), ("AS Roma", 2024)]),
    S("Lorenzo Pellegrini", "Midfielder", "Italy", 1996, 20, [("AS Roma", 2015)]),
    S("Donyell Malen", "Forward", "Netherlands", 1999, 30, [("PSV Eindhoven", 2018), ("Borussia Dortmund", 2021), ("Aston Villa", 2024), ("AS Roma", 2026)]),
    S("Gianluca Mancini", "Defender", "Italy", 1996, 15, [("Atalanta BC", 2017), ("AS Roma", 2019)]),
    S("Evan N'Dicka", "Defender", "Ivory Coast", 1999, 25, [("Eintracht Frankfurt", 2019), ("AS Roma", 2023)]),
    # --- SSC Napoli ---
    S("Kevin De Bruyne", "Midfielder", "Belgium", 1991, 15, [("KRC Genk", 2008), ("Chelsea FC", 2012), ("VfL Wolfsburg", 2014), ("Manchester City", 2015), ("SSC Napoli", 2025)]),
    S("Scott McTominay", "Midfielder", "Scotland", 1996, 55, [("Manchester United", 2017), ("SSC Napoli", 2024)]),
    S("Rasmus Højlund", "Forward", "Denmark", 2003, 40, [("Atalanta BC", 2022), ("Manchester United", 2023), ("SSC Napoli", 2025)]),
    S("Stanislav Lobotka", "Midfielder", "Slovakia", 1994, 15, [("SSC Napoli", 2020)]),
    S("André-Frank Zambo Anguissa", "Midfielder", "Cameroon", 1995, 15, [("Fulham FC", 2018), ("Villarreal CF", 2021), ("SSC Napoli", 2022)]),
    S("Giovanni Di Lorenzo", "Defender", "Italy", 1993, 15, [("FC Empoli", 2017), ("SSC Napoli", 2019)]),
    # --- Juventus ---
    S("Kenan Yıldız", "Forward", "Turkey", 2005, 100, [("Juventus FC", 2022)]),
    S("Manuel Locatelli", "Midfielder", "Italy", 1998, 30, [("AC Milan", 2016), ("US Sassuolo", 2018), ("Juventus FC", 2021)]),
    S("Teun Koopmeiners", "Midfielder", "Netherlands", 1998, 40, [("AZ Alkmaar", 2017), ("Atalanta BC", 2021), ("Juventus FC", 2024)]),
    S("Francisco Conceição", "Forward", "Portugal", 2002, 35, [("FC Porto", 2021), ("Juventus FC", 2024)]),
    S("Khéphren Thuram", "Midfielder", "France", 2001, 40, [("OGC Nice", 2019), ("Juventus FC", 2024)]),
    S("Gleison Bremer", "Defender", "Brazil", 1997, 50, [("Torino FC", 2018), ("Juventus FC", 2022)]),
    S("Andrea Cambiaso", "Defender", "Italy", 2000, 50, [("Genoa CFC", 2019), ("Juventus FC", 2022)]),
    S("Weston McKennie", "Midfielder", "United States", 1998, 25, [("FC Schalke 04", 2016), ("Juventus FC", 2020)]),
    S("Randal Kolo Muani", "Forward", "France", 1998, 25, [("Eintracht Frankfurt", 2022), ("Paris Saint-Germain", 2023), ("Juventus FC", 2025)]),
    S("Douglas Luiz", "Midfielder", "Brazil", 1998, 25, [("Manchester City", 2017), ("Aston Villa", 2019), ("Juventus FC", 2024)]),
    # --- AC Milan ---
    S("Luka Modrić", "Midfielder", "Croatia", 1985, 3, [("Tottenham Hotspur", 2008), ("Real Madrid", 2012), ("AC Milan", 2025)]),
    S("Christian Pulisic", "Forward", "United States", 1998, 40, [("Borussia Dortmund", 2015), ("Chelsea FC", 2019), ("AC Milan", 2023)]),
    S("Adrien Rabiot", "Midfielder", "France", 1995, 25, [("Paris Saint-Germain", 2012), ("Juventus FC", 2019), ("Olympique Marseille", 2024), ("AC Milan", 2025)]),
    S("Mike Maignan", "Goalkeeper", "France", 1995, 40, [("LOSC Lille", 2015), ("AC Milan", 2021)]),
    S("Gonçalo Ramos", "Forward", "Portugal", 2001, 40, [("SL Benfica", 2020), ("Paris Saint-Germain", 2023), ("AC Milan", 2026)]),
    S("Christopher Nkunku", "Forward", "France", 1997, 25, [("Paris Saint-Germain", 2015), ("RB Leipzig", 2019), ("Chelsea FC", 2023), ("AC Milan", 2025)]),
]

MANAGERS = [
    M("Cristian Chivu", "Romania", [("Parma Calcio 1913", 2024, 2025), ("Inter Milan", 2025, None)]),
    M("Gian Piero Gasperini", "Italy", [("Atalanta BC", 2016, 2025), ("AS Roma", 2025, None)]),
    M("Massimiliano Allegri", "Italy", [("AC Milan", 2010, 2014), ("Juventus FC", 2014, 2019), ("Juventus FC", 2021, 2024),
        ("AC Milan", 2025, 2026), ("SSC Napoli", 2026, None)]),
    M("Luciano Spalletti", "Italy", [("AS Roma", 2005, 2009), ("AS Roma", 2016, 2017), ("Inter Milan", 2017, 2019),
        ("SSC Napoli", 2021, 2023), ("Juventus FC", 2025, None)]),
    M("Rúben Amorim", "Portugal", [("Sporting CP", 2020, 2024), ("Manchester United", 2024, 2026), ("AC Milan", 2026, None)]),
]


def batch(cypher, rows, size=200):
    for i in range(0, len(rows), size):
        run_query(cypher, {"rows": rows[i:i + size]})


def main():
    ok, message = verify_connection()
    if not ok:
        print(f"Cannot connect: {message}")
        sys.exit(1)

    players, stints = [], []
    for s in STARS:
        players.append({"name": s["name"], "props": {
            "position": s["position"], "nationality": s["nationality"], "birth_year": s["birth_year"],
            "market_value": s["market_value"], "value_source": "approximate", "source": "curated-2026"}})
        h = s["history"]
        for i, (club, start) in enumerate(h):
            stints.append({"player": s["name"], "club": club, "from_year": start,
                           "to_year": h[i + 1][1] if i + 1 < len(h) else None})
    spells = [{"manager": m["name"], "club": c, "from_year": a, "to_year": b} for m in MANAGERS for (c, a, b) in m["spells"]]

    clubs = sorted({s["club"] for s in stints} | {s["club"] for s in spells})
    batch("UNWIND $rows AS row MERGE (c:Club {name: row.club})", [{"club": c} for c in clubs])
    batch("""UNWIND $rows AS row
             MATCH (c:Club {name: row.club}), (l:League {name: 'Serie A'})
             MERGE (c)-[:COMPETES_IN]->(l)""", [{"club": c} for c in SERIE_A])
    batch("UNWIND $rows AS row MERGE (p:Player {name: row.name}) SET p += row.props", players)
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             MERGE (p)-[r:PLAYED_FOR]->(c)
             SET r.from_year = row.from_year, r.to_year = row.to_year""", stints)
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             WHERE row.from_year > 2010
             MERGE (p)-[r:TRANSFERRED_TO]->(c)
             SET r.year = row.from_year""", [s for s in stints if s["from_year"] and s["club"] != [x for x in stints if x["player"] == s["player"]][0]["club"]])
    batch("UNWIND $rows AS row MERGE (m:Manager {name: row.name}) SET m.nationality = row.nationality, m.source = 'curated-2026'",
          [{"name": m["name"], "nationality": m["nationality"]} for m in MANAGERS])
    batch("""UNWIND $rows AS row
             MATCH (c:Club {name: row.club}), (m:Manager {name: row.manager})
             MERGE (c)-[r:MANAGED_BY {from_year: row.from_year}]->(m)
             SET r.to_year = row.to_year""", spells)

    print(f"{len(players)} Serie A stars, {len(MANAGERS)} managers, {len(stints)} stints")
    for row in run_query("MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY label"):
        print(f"  {row['label']}: {row['n']}")
    close_driver()


if __name__ == "__main__":
    main()