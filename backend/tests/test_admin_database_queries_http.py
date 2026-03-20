"""HTTP-kontrakt för admin database-queries (ingen DB för katalog; run kräver DB)."""

from contextlib import contextmanager

from fastapi.testclient import TestClient

from app.deps import CurrentUser, require_admin
from app.main import app

client = TestClient(app)


def _admin_override():
    return CurrentUser(anvandar_id=1, ar_admin=True)


def test_database_queries_catalog_get_200():
    app.dependency_overrides[require_admin] = _admin_override
    try:
        r = client.get("/api/admin/db-queries")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 17
        ids = {x["id"] for x in data}
        assert "alla-anvandare" in ids
        assert "aktivitetslogg" in ids
        assert "rapport-poster-per-kategori" in ids
    finally:
        app.dependency_overrides.clear()


def test_database_queries_alias_paths_get_200():
    app.dependency_overrides[require_admin] = _admin_override
    try:
        r1 = client.get("/api/admin/database-queries")
        r2 = client.get("/api/admin/vg-queries")
        assert r1.status_code == 200, r1.text
        assert r2.status_code == 200, r2.text
        assert len(r1.json()) == 17
        assert len(r2.json()) == 17
    finally:
        app.dependency_overrides.clear()


def test_database_queries_catalog_forbidden_without_admin():
    app.dependency_overrides.clear()
    r = client.get("/api/admin/db-queries")
    assert r.status_code == 401


def test_database_queries_run_first_select(monkeypatch):
    """Kör första SELECT med mockad cursor om DB saknas i CI."""
    app.dependency_overrides[require_admin] = _admin_override
    fake_rows = [{"AnvandarID": 1, "Anvandarnamn": "Admin", "Epost": "admin@tyda.local", "ArAdmin": 1, "SkapadDatum": "2024-01-01"}]

    class _FakeCursor:
        def execute(self, sql):
            pass

        def fetchall(self):
            return fake_rows

    @contextmanager
    def fake_get_cursor(dictionary=True):
        yield _FakeCursor()

    monkeypatch.setattr("app.routers.admin_database_queries.get_cursor", fake_get_cursor)
    try:
        r = client.post("/api/admin/db-queries/alla-anvandare/run", json={})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["query_id"] == "alla-anvandare"
        assert body["row_count"] == 1
        assert body["columns"]
    finally:
        app.dependency_overrides.clear()


def test_database_queries_run_call_consumes_extra_result_sets(monkeypatch):
    app.dependency_overrides[require_admin] = _admin_override
    fake_rows = [{"KategoriID": 1, "Namn": "drom", "AntalPoster": 2}]

    class _FakeCursor:
        def __init__(self):
            self._nextset_calls = 0

        def execute(self, sql):
            pass

        def fetchall(self):
            return fake_rows if self._nextset_calls == 0 else []

        def nextset(self):
            self._nextset_calls += 1
            return self._nextset_calls == 1

    @contextmanager
    def fake_get_cursor(dictionary=True):
        yield _FakeCursor()

    monkeypatch.setattr("app.routers.admin_database_queries.get_cursor", fake_get_cursor)
    try:
        r = client.post("/api/admin/db-queries/rapport-poster-per-kategori/run", json={})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["query_id"] == "rapport-poster-per-kategori"
        assert body["kind"] == "call"
        assert body["row_count"] == 1
        assert body["rows"][0]["Namn"] == "drom"
    finally:
        app.dependency_overrides.clear()
