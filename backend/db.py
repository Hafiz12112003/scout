"""
CognoDB (Neo4j-compatible) connection handler.
Uses the official Neo4j Python driver over Bolt.
"""
import os
import time
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError

_driver = None


def get_driver():
    """Lazily create and return a singleton Neo4j driver instance."""
    global _driver
    if _driver is None:
        uri = os.environ.get("COGNODB_URI")
        username = os.environ.get("COGNODB_USERNAME")
        password = os.environ.get("COGNODB_PASSWORD")

        if not all([uri, username, password]):
            raise RuntimeError(
                "Missing CognoDB credentials. Check your .env file has "
                "COGNODB_URI, COGNODB_USERNAME, COGNODB_PASSWORD set."
            )

        # No custom resolver here - some networks (e.g. IPv6-only/NAT64,
        # common with certain ISPs) only have a route via the synthesized
        # IPv6 address, so forcing IPv4 breaks connectivity entirely.
        # Let the driver negotiate normally; retries below absorb the
        # occasional TLS handshake hiccup that NAT64 tunnels can cause.
        _driver = GraphDatabase.driver(
            uri,
            auth=(username, password),
            connection_timeout=20,
            max_transaction_retry_time=20,
        )
    return _driver


def verify_connection(retries=3, delay_seconds=2):
    """
    Ping the database, retrying a few times.
    NAT64/IPv6-only networks can see a transient failure on the first TLS
    handshake attempt after a fresh TCP connect - a short retry loop
    absorbs that without masking a genuinely down instance.
    """
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            driver = get_driver()
            driver.verify_connectivity()
            return True, "Connected to CognoDB"
        except AuthError:
            return False, "Authentication failed - check username/password"
        except ServiceUnavailable as e:
            last_error = e
        except Exception as e:
            last_error = e

        if attempt < retries:
            time.sleep(delay_seconds)

    return False, f"CognoDB instance unreachable after {retries} attempts - check URI, instance status, or network. Last error: {last_error}"


def run_query(cypher, parameters=None, retries=3, delay_seconds=1.5):
    """
    Execute a parameterised Cypher query and return a list of dict records.
    Never use string-concatenated Cypher - always pass parameters here.
    Retries a few times to absorb transient write failures some networks
    (e.g. IPv6-only/NAT64) occasionally hit mid-session.
    """
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            driver = get_driver()
            with driver.session() as session:
                result = session.run(cypher, parameters or {})
                return [record.data() for record in result]
        except ServiceUnavailable as e:
            last_error = e
            if attempt < retries:
                time.sleep(delay_seconds)
    raise ServiceUnavailable(f"Query failed after {retries} attempts: {last_error}")


def close_driver():
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None
