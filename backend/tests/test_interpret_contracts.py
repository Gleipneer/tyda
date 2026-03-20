import json

import pytest
from fastapi import HTTPException

from app.routers.interpret import (
    CONTRACTS,
    _completion_create_kwargs,
    _default_supported_model_row,
    _ensure_model_visible_in_status,
    _render_interpretation_text,
    _resolve_interpret_contract,
    _resolve_model_choice,
    _structure_ai_response,
    SUPPORTED_MODELS,
)


def test_resolve_dream_contract_by_category():
    contract, kind = _resolve_interpret_contract(None, "drom")
    assert kind == "dream"
    assert contract.label == "Drömtolkning"
    assert contract.caution_level == "high"


def test_resolve_poem_contract_by_category():
    contract, kind = _resolve_interpret_contract(None, "dikt")
    assert kind == "poem"


def test_resolve_event_experience_for_vision_category():
    contract, kind = _resolve_interpret_contract(None, "vision")
    assert kind == "event_experience"
    assert contract.kind == "event_experience"


def test_resolve_reflection_for_reflektion():
    contract, kind = _resolve_interpret_contract(None, "reflektion")
    assert kind == "reflection"


def test_resolve_kind_override_ignores_category():
    contract, kind = _resolve_interpret_contract("poem", "drom")
    assert kind == "poem"
    assert contract.kind == "poem"


def test_supported_models_offer_modern_choices():
    model_ids = [model.id for model in SUPPORTED_MODELS]
    assert model_ids == ["gpt-4.1-mini", "gpt-4.1", "gpt-4o", "gpt-5-mini", "gpt-5"]


def test_resolve_model_accepts_supported_choice():
    mid, req = _resolve_model_choice("gpt-5-mini")
    assert mid == "gpt-5-mini"
    assert req == "gpt-5-mini"


def test_resolve_model_rejects_unknown():
    with pytest.raises(ValueError):
        _resolve_model_choice("gpt-3.5-turbo")


def test_status_guard_allows_visible_model(monkeypatch):
    monkeypatch.setattr(
        "app.routers.interpret._options_for_status",
        lambda: ([_default_supported_model_row()], False, "status kunde inte verifieras"),
    )
    verified, msg = _ensure_model_visible_in_status("gpt-4.1-mini")
    assert verified is False
    assert "kunde inte verifieras" in str(msg)


def test_status_guard_blocks_hidden_stale_model(monkeypatch):
    monkeypatch.setattr(
        "app.routers.interpret._options_for_status",
        lambda: ([_default_supported_model_row()], False, "Endast standardmodellen visas"),
    )
    with pytest.raises(HTTPException) as exc:
        _ensure_model_visible_in_status("gpt-5")
    assert exc.value.status_code == 400
    assert "nuvarande serverkonfiguration" in str(exc.value.detail)


def test_completion_kwargs_use_max_tokens_for_legacy_models():
    assert _completion_create_kwargs("gpt-4.1-mini") == {"temperature": 0.2, "max_tokens": 1200}


def test_completion_kwargs_use_max_completion_tokens_for_gpt5():
    assert _completion_create_kwargs("gpt-5") == {"max_completion_tokens": 1200}


def test_poem_contract_has_six_uniform_sections():
    spec = CONTRACTS["poem"]
    ids = [s.id for s in spec.sections]
    assert ids == [
        "overview",
        "carrying_elements",
        "inner_movement",
        "themes",
        "open_question",
        "caution",
    ]


def test_structure_ai_response_uses_contract_sections():
    contract, _ = _resolve_interpret_contract("poem", "dikt")
    payload = {
        "sections": [
            {"id": "overview", "content": "Dikten kretsar kring en stilla förlust."},
            {"id": "carrying_elements", "content": "Vatten och skugga bär mycket av spänningen."},
            {"id": "inner_movement", "content": "En rörelse från öppenhet mot tystnad."},
            {"id": "themes", "content": "Tema om avstånd och längtan."},
            {"id": "open_question", "content": "Vad lämnas avsiktligt outsagt?"},
            {"id": "caution", "content": "Detta är en möjlig läsning, inte facit."},
        ]
    }

    sections, degraded = _structure_ai_response(json.dumps(payload), contract)

    assert [section.id for section in sections] == [
        "overview",
        "carrying_elements",
        "inner_movement",
        "themes",
        "open_question",
        "caution",
    ]
    assert degraded is False
    assert "Dikten kretsar" in _render_interpretation_text(sections)


def test_structure_ai_response_marks_degraded_when_section_missing():
    contract, _ = _resolve_interpret_contract(None, "reflektion")
    payload = {
        "sections": [
            {"id": "overview", "content": "Endast en del följde med."},
        ]
    }
    sections, degraded = _structure_ai_response(json.dumps(payload), contract)
    assert degraded is True
    assert len(sections) == 6
    texts = [s.content for s in sections]
    assert len(set(texts)) >= 4


def test_structure_ai_response_no_repeated_mechanical_line():
    contract, _ = _resolve_interpret_contract(None, "drom")
    raw = "Första stycket om drömmen.\n\nAndra stycket."

    sections, degraded = _structure_ai_response(raw, contract)

    assert degraded is True
    mechanical = "Modellen svarade inte helt enligt kontraktet den här gången."
    assert all(mechanical not in s.content for s in sections)
