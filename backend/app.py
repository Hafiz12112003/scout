"""
Scout - Football Scouting & Transfer Intelligence Platform
Flask API backed by CognoDB (graph database).
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from db import verify_connection, close_driver
from routes.players import players_bp
from routes.clubs import clubs_bp
from routes.network import network_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(players_bp, url_prefix="/api/players")
app.register_blueprint(clubs_bp, url_prefix="/api/clubs")
app.register_blueprint(network_bp, url_prefix="/api/network")


@app.route("/api/health")
def health():
    """Health check - confirms API is up and DB is reachable."""
    ok, message = verify_connection()
    status_code = 200 if ok else 503
    return jsonify({"database_connected": ok, "message": message}), status_code


@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500


@app.teardown_appcontext
def shutdown_driver(exception=None):
    pass  # driver is a long-lived singleton, closed only on process exit


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
