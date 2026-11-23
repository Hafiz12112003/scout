"""
Adds managers (with career history) and a deeper FC Barcelona squad.
Does NOT wipe the database. Run from backend/ after load_stars.py:
    py scripts\\load_extras.py
Managers: head coaches as of Aug-Nov 2026 (khelnow list cross-checked with club season pages and
Reuters/AP reports for Real Madrid and Chelsea). Histories are curated and may contain gaps.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from db import run_query, verify_connection, close_driver


def S(name, pos, nat, born, value_m, history):
    return {"name": name, "position": pos, "nationality": nat, "birth_year": born,
            "market_value": int(value_m * 1_000_000), "history": history}


def M(name, nat, spells):
    return {"name": name, "nationality": nat, "spells": spells}


BARCELONA = [
    S("Joan García", "Goalkeeper", "Spain", 2001, 25, [("RCD Espanyol Barcelona", 2023), ("FC Barcelona", 2025)]),
    S("Alejandro Balde", "Defender", "Spain", 2003, 50, [("FC Barcelona", 2021)]),
    S("Wojciech Szczęsny", "Goalkeeper", "Poland", 1990, 2, [("Arsenal FC", 2009), ("Juventus FC", 2017), ("FC Barcelona", 2024)]),
    S("Andreas Christensen", "Defender", "Denmark", 1996, 25, [("Chelsea FC", 2014), ("FC Barcelona", 2022)]),
    S("Gerard Martín", "Defender", "Spain", 2002, 20, [("FC Barcelona", 2023)]),
    S("Roony Bardghji", "Forward", "Sweden", 2005, 15, [("FC Copenhagen", 2022), ("FC Barcelona", 2025)]),
    S("Marc Bernal", "Midfielder", "Spain", 2007, 20, [("FC Barcelona", 2023)]),
    S("Eric García", "Defender", "Spain", 2001, 20, [("Manchester City", 2017), ("FC Barcelona", 2021)]),
]

MANAGERS = [
    M("José Mourinho", "Portugal", [("FC Porto", 2002, 2004), ("Chelsea FC", 2004, 2007), ("Inter Milan", 2008, 2010),
        ("Real Madrid", 2010, 2013), ("Chelsea FC", 2013, 2015), ("Manchester United", 2016, 2018),
        ("Tottenham Hotspur", 2019, 2021), ("AS Roma", 2021, 2024), ("Fenerbahçe", 2024, 2025),
        ("SL Benfica", 2025, 2026), ("Real Madrid", 2026, None)]),
    M("Xabi Alonso", "Spain", [("Bayer 04 Leverkusen", 2022, 2025), ("Real Madrid", 2025, 2026), ("Chelsea FC", 2026, None)]),
    M("Hansi Flick", "Germany", [("FC Bayern Munich", 2019, 2021), ("FC Barcelona", 2024, None)]),
    M("Vincent Kompany", "Belgium", [("Burnley FC", 2022, 2024), ("FC Bayern Munich", 2024, None)]),
    M("Luis Enrique", "Spain", [("FC Barcelona", 2014, 2017), ("Paris Saint-Germain", 2023, None)]),
    M("Xavi Hernández", "Spain", [("FC Barcelona", 2021, 2024)]),
    M("Álvaro Arbeloa", "Spain", [("Real Madrid", 2026, 2026), ("Fulham FC", 2026, None)]),
    M("Mikel Arteta", "Spain", [("Arsenal FC", 2019, None)]),
    M("Unai Emery", "Spain", [("Sevilla FC", 2013, 2016), ("Paris Saint-Germain", 2016, 2018), ("Arsenal FC", 2018, 2019),
        ("Villarreal CF", 2020, 2022), ("Aston Villa", 2022, None)]),
    M("Enzo Maresca", "Italy", [("Leicester City", 2023, 2024), ("Chelsea FC", 2024, 2026), ("Manchester City", 2026, None)]),
    M("Roberto De Zerbi", "Italy", [("Brighton & Hove Albion", 2022, 2024), ("Olympique Marseille", 2024, 2026), ("Tottenham Hotspur", 2026, None)]),
    M("Marco Rose", "Germany", [("AFC Bournemouth", 2026, None)]),
    M("Oliver Glasner", "Austria", [("Eintracht Frankfurt", 2021, 2023), ("Crystal Palace", 2024, 2026), ("Nottingham Forest", 2026, None)]),
    M("Andoni Iraola", "Spain", [("Rayo Vallecano", 2021, 2023), ("AFC Bournemouth", 2023, 2026), ("Liverpool FC", 2026, None)]),
    M("Frank Lampard", "England", [("Chelsea FC", 2019, 2021), ("Everton FC", 2022, 2023), ("Coventry City", 2025, None)]),
    M("David Moyes", "Scotland", [("Everton FC", 2002, 2013), ("Manchester United", 2013, 2014), ("West Ham United", 2019, 2024), ("Everton FC", 2025, None)]),
    M("Michael Carrick", "England", [("Middlesbrough FC", 2022, 2025), ("Manchester United", 2026, None)]),
    M("Matthias Jaissle", "Germany", [("Red Bull Salzburg", 2021, 2023), ("Newcastle United", 2026, None)]),
    M("Fabian Hürzeler", "Germany", [("FC St. Pauli", 2023, 2024), ("Brighton & Hove Albion", 2024, None)]),
    M("Daniel Farke", "Germany", [("Norwich City", 2017, 2021), ("Leeds United", 2025, None)]),
    M("Régis Le Bris", "France", [("FC Lorient", 2021, 2024), ("Sunderland AFC", 2024, None)]),
    M("Keith Andrews", "Ireland", [("Brentford FC", 2025, None)]),
    M("Sergej Jakirović", "Bosnia and Herzegovina", [("Hull City", 2025, None)]),
    M("Pierre Sage", "France", [("Crystal Palace", 2026, None)]),
    M("Gary O'Neil", "England", [("AFC Bournemouth", 2022, 2023), ("Wolverhampton Wanderers", 2023, 2024), ("Ipswich Town", 2026, None)]),
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
    for s in BARCELONA:
        players.append({"name": s["name"], "props": {
            "position": s["position"], "nationality": s["nationality"], "birth_year": s["birth_year"],
            "market_value": s["market_value"], "value_source": "approximate", "source": "curated-2026"}})
        h = s["history"]
        for i, (club, start) in enumerate(h):
            stints.append({"player": s["name"], "club": club, "from_year": start,
                           "to_year": h[i + 1][1] if i + 1 < len(h) else None})
    stints.append({"player": "Marcus Rashford", "club": "FC Barcelona", "from_year": 2025, "to_year": 2026})

    batch("UNWIND $rows AS row MERGE (c:Club {name: row.club})", [{"club": c} for c in sorted({s["club"] for s in stints})])
    batch("UNWIND $rows AS row MERGE (p:Player {name: row.name}) SET p += row.props", players)
    batch("""UNWIND $rows AS row
             MATCH (p:Player {name: row.player}), (c:Club {name: row.club})
             MERGE (p)-[r:PLAYED_FOR]->(c)
             SET r.from_year = row.from_year, r.to_year = row.to_year""", stints)

    batch("UNWIND $rows AS row MERGE (m:Manager {name: row.name}) SET m.nationality = row.nationality, m.source = 'curated-2026'",
          [{"name": m["name"], "nationality": m["nationality"]} for m in MANAGERS])
    spells = [{"manager": m["name"], "club": c, "from_year": a, "to_year": b} for m in MANAGERS for (c, a, b) in m["spells"]]
    batch("UNWIND $rows AS row MERGE (c:Club {name: row.club})", [{"club": c} for c in sorted({s["club"] for s in spells})])
    batch("""UNWIND $rows AS row
             MATCH (c:Club {name: row.club}), (m:Manager {name: row.manager})
             MERGE (c)-[r:MANAGED_BY {from_year: row.from_year}]->(m)
             SET r.to_year = row.to_year""", spells)

    print(f"{len(players)} Barcelona players, {len(MANAGERS)} managers, {len(spells)} manager spells")
    for row in run_query("MATCH (n) RETURN labels(n)[0] AS label, count(*) AS n ORDER BY label"):
        print(f"  {row['label']}: {row['n']}")
    close_driver()


if __name__ == "__main__":
    main()