"""
API-kontrakt för live symbolmatchning (Ny post) utan live-databas.
Verifierar: POST /api/analyze/text-concepts, payload { "text": "..." }, response { "matches": [...] }.
"""
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

GOLDEN_LIVE_TEXT = (
    "Jag drömde att jag stod inför en enorm staty. Huvudet var av guld, bröstet av silver, "
    "magen av brons, benen av järn, fötterna av järn och lera. En sten träffade statyn och "
    "blev till ett berg som fyllde hela jorden."
)


def _minimal_lexicon_rows():
    """Samma basformer som symbol_matcher förväntar (Ord-nycklar)."""
    words = [
        "dröm",
        "staty",
        "guld",
        "silver",
        "brons",
        "järn",
        "lera",
        "sten",
        "berg",
        "jord",
        "huvud",
        "bröst",
        "mage",
        "ben",
        "fot",
    ]
    return [{"BegreppID": i + 1, "Ord": w, "Beskrivning": "test"} for i, w in enumerate(words)]


@patch("app.routers.analyze.concept_repo.get_all_concepts", return_value=_minimal_lexicon_rows())
def test_post_analyze_text_concepts_returns_matches_shape(_mock):
    r = client.post("/api/analyze/text-concepts", json={"text": GOLDEN_LIVE_TEXT})
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, dict)
    assert "matches" in data
    assert isinstance(data["matches"], list)
    assert len(data["matches"]) >= 5
    first = data["matches"][0]
    assert "begrepp_id" in first
    assert "ord" in first
    assert "beskrivning" in first
    assert "matched_token" in first
    assert "match_type" in first
    assert "score" in first


@patch("app.routers.analyze.concept_repo.get_all_concepts", return_value=[])
def test_post_analyze_empty_lexicon_returns_empty_matches(_mock):
    r = client.post("/api/analyze/text-concepts", json={"text": "guld silver berg"})
    assert r.status_code == 200
    assert r.json() == {"matches": []}


def test_post_analyze_requires_json_body():
    r = client.post("/api/analyze/text-concepts", json={})
    assert r.status_code == 422
