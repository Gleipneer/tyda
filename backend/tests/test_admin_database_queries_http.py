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
        r = client.get("/api/admin/database-queries")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 12
        ids = {x["id"] for x in data}
        assert "where-kategori-drom" in ids
        assert "join-aktivitet-poster" in ids
        assert "proc-hamta-poster-per-kategori" in ids
    finally:
        app.dependency_overrides.clear()


def test_database_queries_legacy_vg_path_alias_get_200():
    app.dependency_overrides[require_admin] = _admin_override
    try:
        r = client.get("/api/admin/vg-queries")
        assert r.status_code == 200, r.text
        assert len(r.json()) >= 12
    finally:
        app.dependency_overrides.clear()


def test_database_queries_catalog_forbidden_without_admin():
    app.dependency_overrides.clear()
    r = client.get("/api/admin/database-queries")
    assert r.status_code == 401


def test_database_queries_run_first_select(monkeypatch):
    """Kör första SELECT med mockad cursor om DB saknas i CI."""
    app.dependency_overrides[require_admin] = _admin_override
    fake_rows = [{"PostID": 1, "Titel": "x", "Synlighet": "publik", "SkapadDatum": "2024-01-01"}]

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
        r = client.post("/api/admin/database-queries/where-kategori-drom/run", json={})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["query_id"] == "where-kategori-drom"
        assert body["row_count"] == 1
        assert body["columns"]
    finally:
        app.dependency_overrides.clear()
