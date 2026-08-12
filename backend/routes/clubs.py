from flask import Blueprint, request, jsonify
from db import run_query

clubs_bp = Blueprint("clubs", __name__)


@clubs_bp.route("/search", methods=["GET"])
def search_clubs():
    """Search clubs by name."""
    name = request.args.get("name", "")
    cypher = """
    MATCH (c:Club)
    WHERE toLower(c.name) CONTAINS toLower($name)
    OPTIONAL MATCH (c)-[:COMPETES_IN]->(l:League)
    RETURN c.name AS name, c.country AS country, c.founded AS founded,
           l.name AS league
    LIMIT 25
    """
    try:
        results = run_query(cypher, {"name": name})
        return jsonify({"clubs": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@clubs_bp.route("/<club_name>/squad", methods=["GET"])
def get_squad(club_name):
    """Current squad at a club."""
    cypher = """
    MATCH (p:Player)-[played:PLAYED_FOR]->(c:Club {name: $club_name})
    WHERE played.to_year IS NULL OR played.to_year >= 2026
    RETURN p.name AS name, p.position AS position, p.nationality AS nationality,
           played.appearances AS appearances, played.goals AS goals
    ORDER BY played.appearances DESC
    """
    try:
        results = run_query(cypher, {"club_name": club_name})
        return jsonify({"squad": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@clubs_bp.route("/<club_name>/agent-clusters", methods=["GET"])
def agent_clusters(club_name):
    """
    Which agents have moved multiple players to this club within 2 years of each other.
    Surfaces recruitment/agent-network patterns - a query relational DBs handle awkwardly.
    """
    cypher = """
    MATCH (a:Agent)<-[:REPRESENTED_BY]-(p:Player)-[t:TRANSFERRED_TO]->(c:Club {name: $club_name})
    WITH a, collect({player: p.name, year: t.year}) AS moves
    WHERE size(moves) >= 2
    RETURN a.name AS agent_name, a.agency AS agency, moves
    ORDER BY size(moves) DESC
    """
    try:
        results = run_query(cypher, {"club_name": club_name})
        return jsonify({"agent_clusters": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500
