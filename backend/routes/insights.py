from datetime import date
from flask import Blueprint, request, jsonify
from db import run_query

insights_bp = Blueprint("insights", __name__)

POSITIONS = {"Goalkeeper", "Defender", "Midfielder", "Forward"}


@insights_bp.route("/hidden-gems", methods=["GET"])
def hidden_gems():
    """Players whose market value is well below what the value model expects (Premier League only)."""
    position = request.args.get("position", "")
    if position and position not in POSITIONS:
        return jsonify({"error": "Unknown position"}), 400
    try:
        max_age = int(request.args.get("max_age", 28))
        min_value = int(request.args.get("min_value", 5_000_000))
        limit = min(int(request.args.get("limit", 20)), 50)
    except ValueError:
        return jsonify({"error": "max_age, min_value and limit must be numbers"}), 400

    cypher = """
    MATCH (p:Player)
    WHERE p.upside_pct IS NOT NULL AND p.market_value >= $min_value
      AND p.birth_year >= $min_birth_year AND ($position = '' OR p.position = $position)
    OPTIONAL MATCH (p)-[r:PLAYED_FOR]->(c:Club) WHERE r.to_year IS NULL
    WITH p, collect(c.name)[0] AS club
    RETURN p.name AS name, p.position AS position, p.nationality AS nationality,
           p.birth_year AS birth_year, p.market_value AS market_value,
           p.predicted_value AS predicted_value, p.upside_pct AS upside_pct,
           p.model_minutes AS model_minutes, club
    ORDER BY p.upside_pct DESC
    LIMIT $limit
    """
    try:
        rows = run_query(cypher, {
            "min_value": min_value, "position": position, "limit": limit,
            "min_birth_year": date.today().year - max_age,
        })
        return jsonify({"gems": rows})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@insights_bp.route("/model-card", methods=["GET"])
def model_card():
    """Cross-validated metrics of the value model, stored in the graph when it was trained."""
    try:
        rows = run_query("MATCH (m:ModelInfo {name: 'value-model'}) RETURN properties(m) AS info")
        return jsonify(rows[0]["info"] if rows else {})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@insights_bp.route("/reach", methods=["GET"])
def reach():
    """Shortest connection between a club and a player through squads and managers."""
    club = request.args.get("club", "")
    player = request.args.get("player", "")
    cypher = """
    MATCH (c:Club {name: $club}), (p:Player {name: $player})
    MATCH path = shortestPath((c)-[:PLAYED_FOR|MANAGED_BY*..6]-(p))
    RETURN [n IN nodes(path) | {name: n.name, kind: labels(n)[0]}] AS chain, length(path) AS hops
    """
    try:
        rows = run_query(cypher, {"club": club, "player": player})
        if not rows:
            return jsonify({"error": "No connection found"}), 404
        return jsonify(rows[0])
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500