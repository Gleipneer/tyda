"""Gemensam match-text + chain-status (diagnostik)."""
import importlib.util
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.migrations_meta import MIGRATION_COUNT
from app.services.match_text import compose_post_text_for_match

client = TestClient(app)


def test_compose_post_text_for_match_parity_with_saved_post():
    assert compose_post_text_for_match("A", "B") == "A B"
    assert compose_post_text_for_match("", "B") == "B"
    assert compose_post_text_for_match("A", "") == "A"
    assert compose_post_text_for_match("  A  ", "  B  ") == "A B"
    assert compose_post_text_for_match(None, "x") == "x"


def test_migration_meta_matches_runner_tuple_length():
    script = Path(__file__).resolve().parent.parent / "scripts" / "run_migration_utf8.py"
    spec = importlib.util.spec_from_file_location("run_migration_utf8", script)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert len(mod.MIGRATIONS) == MIGRATION_COUNT


@patch("app.routers.analyze.check_db_connection", return_value=False)
def test_chain_status_db_disconnected(_mock):
    r = client.get("/api/analyze/chain-status")
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is False
    assert d["begrepp_count"] == 0


@patch("app.routers.analyze.check_db_connection", return_value=True)
@patch("app.routers.analyze.concept_repo.count_begrepp", return_value=200)
@patch("app.routers.analyze.concept_repo.count_schema_migrations", return_value=MIGRATION_COUNT)
def test_chain_status_healthy(_a, _b, _c):
    r = client.get("/api/analyze/chain-status")
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["begrepp_count"] == 200
    assert d["lexicon_suspect_incomplete"] is False


@patch("app.routers.analyze.check_db_connection", return_value=True)
@patch("app.routers.analyze.concept_repo.count_begrepp", return_value=5)
@patch("app.routers.analyze.concept_repo.count_schema_migrations", return_value=3)
def test_chain_status_flags_suspect_lexicon(_a, _b, _c):
    r = client.get("/api/analyze/chain-status")
    d = r.json()
    assert d["ok"] is True
    assert d["lexicon_suspect_incomplete"] is True
