"""
Quick sanity check: confirms your .env credentials can reach CognoDB.
Run from the backend/ folder with: python scripts/test_connection.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from db import verify_connection

if __name__ == "__main__":
    ok, message = verify_connection()
    print(f"{'✅' if ok else '❌'} {message}")
    sys.exit(0 if ok else 1)
