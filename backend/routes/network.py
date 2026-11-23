from datetime import date
from flask import Blueprint, request, jsonify
from db import run_query

network_bp = Blueprint("network", __name__)


@network_bp.route("/scouting-chain", methods=["GET"])
def scouting_chain():
    """
    Young players connected to a given player through a shared former club, who are not already
    at the target club. Ranked by how undervalued the value model thinks they are (when known),
    then by market value. Representation is shown when it is on record.
    """
    player_name = request.args.get("player", "")
    target_club = request.args.get("target_club", "")
    try:
        max_age = int(request.args.get("max_age", 25))
    except ValueError:
        return jsonify({"error": "max_age must be a number"}), 400
    min_birth_year = date.today().year - max_age

    cypher = """
    MATCH (source:Player {name: $player_name})-[:PLAYED_FOR]->(shared:Club)<-[:PLAYED_FOR]-(candidate:Player)
    WHERE candidate.name <> $player_name AND candidate.birth_year >= $min_birth_year
    OPTIONAL MATCH (candidate)-[atTarget:PLAYED_FOR]->(:Club {name: $target_club})
    WHERE atTarget.to_year IS NULL
    WITH candidate, shared, atTarget
    WHERE atTarget IS NULL
    OPTIONAL MATCH (candidate)-[:REPRESENTED_BY]->(agent:Agent)
    RETURN candidate.name AS name, candidate.position AS position, candidate.birth_year AS birth_year,
           candidate.market_value AS market_value, candidate.upside_pct AS upside_pct,
           agent.name AS agent_name, collect(DISTINCT shared.name)[0] AS shared_club
    ORDER BY coalesce(candidate.upside_pct, -1000) DESC, candidate.market_value DESC
    LIMIT 25
    """
    try:
        results = run_query(cypher, {
            "player_name": player_name,
            "target_club": target_club,
            "min_birth_year": min_birth_year,
        })
        return jsonify({"candidates": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@network_bp.route("/shortest-path", methods=["GET"])
def shortest_path():
    """Degrees of separation between two players via shared clubs."""
    player_a = request.args.get("player_a", "")
    player_b = request.args.get("player_b", "")

    cypher = """
    MATCH path = shortestPath(
        (a:Player {name: $player_a})-[:PLAYED_FOR*..10]-(b:Player {name: $player_b})
    )
    RETURN [node IN nodes(path) | node.name] AS chain,
           length(path) AS hops
    """
    try:
        results = run_query(cypher, {"player_a": player_a, "player_b": player_b})
        if not results:
            return jsonify({"error": "No connection found between these players"}), 404
        return jsonify(results[0])
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@network_bp.route("/manager-lineage", methods=["GET"])
def manager_lineage():
    """Players who played under managers who later managed a given club."""
    club_name = request.args.get("club", "")

    cypher = """
    MATCH (target:Club {name: $club_name})-[:MANAGED_BY]->(m:Manager)
    MATCH (otherClub:Club)-[:MANAGED_BY]->(m)
    MATCH (p:Player)-[:PLAYED_FOR]->(otherClub)
    WHERE otherClub.name <> $club_name
    RETURN DISTINCT p.name AS player_name, m.name AS manager_name,
           otherClub.name AS previous_club
    LIMIT 25
    """
    try:
        results = run_query(cypher, {"club_name": club_name})
        return jsonify({"players": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@network_bp.route("/stats", methods=["GET"])
def graph_stats():
    """Overall graph size - used for the live counter on the landing page."""
    cypher = """
    MATCH (p:Player) WITH count(p) AS players
    MATCH (c:Club) WITH players, count(c) AS clubs
    MATCH (a:Agent) WITH players, clubs, count(a) AS agents
    MATCH ()-[r]->() WITH players, clubs, agents, count(r) AS relationships
    RETURN players, clubs, agents, relationships
    """
    try:
        results = run_query(cypher)
        return jsonify(results[0] if results else {"players": 0, "clubs": 0, "agents": 0, "relationships": 0})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@network_bp.route("/graph-explore", methods=["GET"])
def graph_explore():
    """Nodes + edges around a player for the frontend network visualization."""
    player_name = request.args.get("player", "")
    cypher = """
    MATCH (p:Player {name: $name})
    OPTIONAL MATCH (p)-[:PLAYED_FOR]->(c:Club)
    OPTIONAL MATCH (p)-[:REPRESENTED_BY]->(a:Agent)
    OPTIONAL MATCH (c)<-[:PLAYED_FOR]-(teammate:Player)
    WHERE teammate.name <> $name
    RETURN p, collect(DISTINCT c) AS clubs, collect(DISTINCT a) AS agents,
           collect(DISTINCT teammate)[..15] AS teammates
    """
    try:
        results = run_query(cypher, {"name": player_name})
        return jsonify(results[0] if results else {})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500