from flask import Blueprint, request, jsonify
from db import run_query

players_bp = Blueprint("players", __name__)


@players_bp.route("/search", methods=["GET"])
def search_players():
    """Search players by name (partial match), optionally filtered by position."""
    name = request.args.get("name", "")
    position = request.args.get("position", "")

    cypher = """
    MATCH (p:Player)
    WHERE toLower(p.name) CONTAINS toLower($name)
      AND ($position = '' OR p.position = $position)
    RETURN p.name AS name, p.position AS position, p.nationality AS nationality,
           p.birth_year AS birth_year, p.market_value AS market_value
    ORDER BY p.market_value DESC
    LIMIT 25
    """
    try:
        results = run_query(cypher, {"name": name, "position": position})
        return jsonify({"players": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@players_bp.route("/<player_name>", methods=["GET"])
def get_player_detail(player_name):
    """Full profile: clubs played for, representation, and the value model's view."""
    cypher = """
    MATCH (p:Player {name: $name})
    OPTIONAL MATCH (p)-[played:PLAYED_FOR]->(c:Club)
    OPTIONAL MATCH (p)-[rep:REPRESENTED_BY]->(a:Agent)
    RETURN p.name AS name, p.position AS position, p.nationality AS nationality,
           p.birth_year AS birth_year, p.market_value AS market_value,
           p.value_source AS value_source, p.contract_until AS contract_until,
           p.predicted_value AS predicted_value, p.upside_pct AS upside_pct,
           p.model_minutes AS model_minutes,
           collect(DISTINCT {club: c.name, from_year: played.from_year,
                              to_year: played.to_year, appearances: played.appearances,
                              goals: played.goals}) AS clubs_history,
           a.name AS agent_name, a.agency AS agent_agency, rep.source AS agent_source
    """
    try:
        results = run_query(cypher, {"name": player_name})
        if not results or not results[0].get("name"):
            return jsonify({"error": "Player not found"}), 404
        return jsonify(results[0])
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@players_bp.route("/<player_name>/teammates", methods=["GET"])
def get_teammates(player_name):
    """Direct teammates (1 hop) - players who shared a club."""
    cypher = """
    MATCH (p:Player {name: $name})-[:PLAYED_FOR]->(c:Club)<-[:PLAYED_FOR]-(teammate:Player)
    WHERE teammate.name <> $name
    RETURN DISTINCT teammate.name AS name, teammate.position AS position,
           c.name AS shared_club
    LIMIT 50
    """
    try:
        results = run_query(cypher, {"name": player_name})
        return jsonify({"teammates": results})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500


@players_bp.route("/<player_name>/similar", methods=["GET"])
def get_similar_players(player_name):
    """
    Players the neural embedding places closest to this one (SIMILAR_TO links written by the
    training script). Falls back to a same-position, similar-value match when there are none.
    """
    neural = """
    MATCH (:Player {name: $name})-[s:SIMILAR_TO]->(c:Player)
    RETURN c.name AS name, c.position AS position, c.nationality AS nationality,
           c.market_value AS market_value, c.upside_pct AS upside_pct, s.score AS score
    ORDER BY s.score DESC
    LIMIT 5
    """
    fallback = """
    MATCH (target:Player {name: $name})
    MATCH (candidate:Player)
    WHERE candidate.name <> $name
      AND candidate.position = target.position
      AND candidate.market_value >= target.market_value * 0.6
      AND candidate.market_value <= target.market_value * 1.4
    RETURN candidate.name AS name, candidate.position AS position,
           candidate.nationality AS nationality, candidate.market_value AS market_value
    ORDER BY abs(candidate.market_value - target.market_value)
    LIMIT 4
    """
    try:
        rows = run_query(neural, {"name": player_name})
        if rows:
            return jsonify({"similar": rows, "method": "neural"})
        return jsonify({"similar": run_query(fallback, {"name": player_name}), "method": "value-band"})
    except Exception as e:
        return jsonify({"error": "Query failed", "detail": str(e)}), 500