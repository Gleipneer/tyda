"""Allowlist-filtrering av modellkatalog (ingen nätverks-I/O)."""
from app.services import interpret_models as im


def test_allowlist_empty_means_full_catalog(monkeypatch):
    monkeypatch.setattr(im.settings, "OPENAI_MODEL_ALLOWLIST", "")
    ids = {m.id for m in im.allowed_model_objects()}
    assert "gpt-5" in ids
    assert "gpt-4.1-mini" in ids


def test_allowlist_restricts_options(monkeypatch):
    monkeypatch.setattr(im.settings, "OPENAI_MODEL_ALLOWLIST", "gpt-5-mini, gpt-4.1")
    objs = im.allowed_model_objects()
    ids = {m.id for m in objs}
    assert ids == {"gpt-5-mini", "gpt-4.1"}
    # Ordning följer alltid huvudkatalogen (gpt-4.1 före gpt-5-mini i SUPPORTED_MODELS)
    assert [m.id for m in objs] == ["gpt-4.1", "gpt-5-mini"]
