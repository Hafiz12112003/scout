"""
Loads the Scout seed dataset into CognoDB.
Uses parameterised Cypher exclusively - no string concatenation.
Run from backend/ folder: python scripts/load_seed_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from db import run_query, verify_connection, close_driver
from scripts.seed_data import CLUBS, LEAGUES, AGENTS, MANAGERS, PLAYERS, MANAGER_TENURES


def clear_database():
    """Wipe existing data - safe to re-run this script from scratch."""
    print("Clearing existing data...")
    run_query("MATCH (n) DETACH DELETE n")


def create_constraints():
    """Uniqueness constraints so re-running MERGE-based loads stays idempotent."""
    print("Creating constraints...")
    constraints = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Player) REQUIRE p.name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Club) REQUIRE c.name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Agent) REQUIRE a.name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Manager) REQUIRE m.name IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (l:League) REQUIRE l.name IS UNIQUE",
    ]
    for c in constraints:
        run_query(c)


def load_leagues():
    print(f"Loading {len(LEAGUES)} leagues...")
    for league in LEAGUES:
        run_query(
            "MERGE (l:League {name: $name}) SET l.country = $country, l.tier = $tier",
            league,
        )


def load_clubs():
    print(f"Loading {len(CLUBS)} clubs...")
    for club in CLUBS:
        run_query(
            """
            MERGE (c:Club {name: $name})
            SET c.country = $country, c.founded = $founded
            WITH c
            MATCH (l:League {name: $league})
            MERGE (c)-[:COMPETES_IN]->(l)
            """,
            club,
        )


def load_agents():
    print(f"Loading {len(AGENTS)} agents...")
    for agent in AGENTS:
        run_query(
            "MERGE (a:Agent {name: $name}) SET a.agency = $agency",
            agent,
        )


def load_managers():
    print(f"Loading {len(MANAGERS)} managers...")
    for manager in MANAGERS:
        run_query(
            "MERGE (m:Manager {name: $name}) SET m.nationality = $nationality",
            manager,
        )


def load_manager_tenures():
    print(f"Loading {len(MANAGER_TENURES)} manager tenures...")
    for tenure in MANAGER_TENURES:
        run_query(
            """
            MATCH (c:Club {name: $club}), (m:Manager {name: $manager})
            MERGE (c)-[r:MANAGED_BY]->(m)
            SET r.from_year = $from_year, r.to_year = $to_year
            """,
            tenure,
        )


def load_players():
    print(f"Loading {len(PLAYERS)} players with history, transfers, and agents...")
    for player in PLAYERS:
        # Core player node
        run_query(
            """
            MERGE (p:Player {name: $name})
            SET p.position = $position, p.nationality = $nationality,
                p.birth_year = $birth_year, p.market_value = $market_value
            """,
            {
                "name": player["name"],
                "position": player["position"],
                "nationality": player["nationality"],
                "birth_year": player["birth_year"],
                "market_value": player["market_value"],
            },
        )

        # Agent - create a placeholder agent node if not in the AGENTS list
        run_query(
            "MERGE (a:Agent {name: $agent_name})",
            {"agent_name": player["agent"]},
        )
        run_query(
            """
            MATCH (p:Player {name: $name}), (a:Agent {name: $agent_name})
            MERGE (p)-[:REPRESENTED_BY]->(a)
            """,
            {"name": player["name"], "agent_name": player["agent"]},
        )

        # Club history (PLAYED_FOR)
        for stint in player["history"]:
            run_query(
                """
                MATCH (p:Player {name: $name}), (c:Club {name: $club})
                MERGE (p)-[r:PLAYED_FOR]->(c)
                SET r.from_year = $from_year, r.to_year = $to_year,
                    r.appearances = $appearances, r.goals = $goals
                """,
                {
                    "name": player["name"],
                    "club": stint["club"],
                    "from_year": stint["from_year"],
                    "to_year": stint["to_year"],
                    "appearances": stint["appearances"],
                    "goals": stint["goals"],
                },
            )

        # Transfers (TRANSFERRED_TO)
        for transfer in player["transfers"]:
            run_query(
                """
                MATCH (p:Player {name: $name}), (c:Club {name: $club})
                MERGE (p)-[r:TRANSFERRED_TO]->(c)
                SET r.year = $year, r.fee = $fee, r.transfer_type = $transfer_type
                """,
                {
                    "name": player["name"],
                    "club": transfer["club"],
                    "year": transfer["year"],
                    "fee": transfer["fee"],
                    "transfer_type": transfer["transfer_type"],
                },
            )


def print_summary():
    counts = run_query(
        """
        MATCH (n)
        RETURN labels(n)[0] AS label, count(*) AS count
        ORDER BY label
        """
    )
    print("\n--- Load summary ---")
    for row in counts:
        print(f"  {row['label']}: {row['count']}")

    rel_counts = run_query(
        """
        MATCH ()-[r]->()
        RETURN type(r) AS rel_type, count(*) AS count
        ORDER BY rel_type
        """
    )
    print("\n--- Relationships ---")
    for row in rel_counts:
        print(f"  {row['rel_type']}: {row['count']}")


if __name__ == "__main__":
    ok, message = verify_connection()
    if not ok:
        print(f"❌ Cannot connect to CognoDB: {message}")
        sys.exit(1)
    print(f"✅ {message}\n")

    clear_database()
    create_constraints()
    load_leagues()
    load_clubs()
    load_agents()
    load_managers()
    load_manager_tenures()
    load_players()

    print_summary()
    print("\n✅ Seed data loaded successfully.")
    close_driver()
