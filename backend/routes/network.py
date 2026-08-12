from flask import Blueprint, request, jsonify
from db import run_query

network_bp = Blueprint("network", __name__)


@network_bp.route("/scouting-chain", methods=["GET"])
def scouting_chain():
    """
    THE signature multi-hop query.
    Find players who were teammates of a given player at any club, are now
    represented by an agent who also represents players at a target club,
    and are under a given age. 3+ hop traversal - very awkward in SQL.
    """
    player_name = request.args.get("player", "")
    target_club = request.args.get("target_club", "")
    max_age = int(request.args.get("max_age", 25))
    min_birth_year = 2026 - max_age

    cypher = """
    MATCH (source:Player {name: $player_name})-[:PLAYED_FOR]->(:Club)<-[:PLAYED_FOR]-(candidate:Player)
    WHERE candidate.name <> $player_name AND candidate.birth_year >= $min_birth_year
    MATCH (candidate)-[:REPRESENTED_BY]->(agent:Agent)
    MATCH (agent)<-[:REPRESENTED_BY]-(:Player)-[:TRANSFERRED_TO]->(:Club {name: $target_club})
    RETURN DISTINCT candidate.name AS name, candidate.position AS position,
           candidate.birth_year AS birth_year, candidate.market_value AS market_value,
           agent.name AS agent_name
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
    RETURN [node IN nodes(path) | coalesce(node.name, node.name)] AS chain,
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
    MATCH (target:Club {name: $club_name})<-[:MANAGED_BY]-(m:Manager)
    MATCH (m)-[:MANAGED_BY]-(otherClub:Club)
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
    """
    Overall graph size - used for the live counter on the landing page.
    A cheap, honest way to show the app is backed by a real, populated graph.
    """
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
def graph_explore():
    """
    Returns nodes + edges around a player for the frontend network visualization.
    """
    player_name = request.args.get("player", "")
    cypher = """
    MATCH (p:Player {name: $name})
    OPTIONAL MATCH (p)-[r1:PLAYED_FOR]->(c:Club)
    OPTIONAL MATCH (p)-[r2:REPRESENTED_BY]->(a:Agent)
    OPTIONAL MATCH (c)<-[r3:PLAYED_FOR]-(teammate:Player)
    WHERE teammate.name <> $name
    RETURN p, collect(DISTINCT c) AS clubs, collect(DISTINCT a) AS agents,
           collect(DISTINCT teammate)[..15] AS teammates
    """
    try:
        results = run_query(cypher, {"name": player_name})
        return jsonify(results[0] if results else {})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500
