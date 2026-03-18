#!/usr/bin/env python3
"""
API-verifieringsscript för Reflektionsarkiv.
Kör när backend är igång och .env har korrekt DB_PASSWORD.
Användning: python scripts/verify_api.py
"""
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BASE = "http://127.0.0.1:8000/api"


def req(method: str, path: str, body: dict | None = None) -> tuple[int, dict | list]:
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    req_obj = Request(url, data=data, method=method, headers={"Content-Type": "application/json"} if body else {})
    try:
        with urlopen(req_obj, timeout=10) as r:
            return r.status, json.loads(r.read().decode())
    except HTTPError as e:
        return e.code, {"error": str(e)}
    except URLError as e:
        return 0, {"error": f"Connection failed: {e.reason}"}


def main():
    errors = []
    ok = []

    # Health
    code, data = req("GET", "/health")
    if code == 200 and data.get("status") == "ok":
        ok.append("GET /api/health")
    else:
        errors.append(f"GET /api/health: {code} {data}")

    # DB Health
    code, data = req("GET", "/db-health")
    if code == 200 and data.get("database") == "connected":
        ok.append("GET /api/db-health")
    else:
        errors.append(f"GET /api/db-health: {code} {data} (DB may need password in .env)")

    # Users
    code, data = req("GET", "/users")
    if code == 200 and isinstance(data, list):
        ok.append("GET /api/users")
    else:
        errors.append(f"GET /api/users: {code}")

    # Categories
    code, data = req("GET", "/categories")
    if code == 200 and isinstance(data, list):
        ok.append("GET /api/categories")
    else:
        errors.append(f"GET /api/categories: {code}")

    # Posts
    code, data = req("GET", "/posts")
    if code == 200 and isinstance(data, list):
        ok.append("GET /api/posts")
    else:
        errors.append(f"GET /api/posts: {code}")

    # Activity
    code, data = req("GET", "/activity")
    if code == 200 and isinstance(data, list):
        ok.append("GET /api/activity")
    else:
        errors.append(f"GET /api/activity: {code}")

    # Analytics
    for path in ["/analytics/posts-per-category", "/analytics/posts-per-user", "/analytics/most-used-concepts"]:
        code, data = req("GET", path)
        if code == 200:
            ok.append(f"GET {path}")
        else:
            errors.append(f"GET {path}: {code}")

    # AI status + endpoint
    code, data = req("GET", "/interpret/status")
    if code == 200 and isinstance(data, dict):
        ok.append("GET /api/interpret/status")
        if data.get("available"):
            code, ai_data = req("POST", "/posts/1/interpret", {})
            if code == 200 and isinstance(ai_data, dict) and ai_data.get("interpretation"):
                ok.append("POST /api/posts/1/interpret")
            else:
                errors.append(f"POST /api/posts/1/interpret: {code} {ai_data}")
    else:
        errors.append(f"GET /api/interpret/status: {code} {data}")

    print("=== VERIFIERADE OK ===")
    for x in ok:
        print("  [OK]", x)

    if errors:
        print("\n=== FEL ===")
        for x in errors:
            print("  [X]", x)
        sys.exit(1)
    print("\nAlla tester godkända.")
    sys.exit(0)


if __name__ == "__main__":
    main()
