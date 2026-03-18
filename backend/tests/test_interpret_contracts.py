import json

from app.routers.interpret import (
    _normalize_model,
    _render_interpretation_text,
    _resolve_interpret_contract,
    _structure_ai_response,
    SUPPORTED_MODELS,
)


def test_resolve_dream_contract():
    contract = _resolve_interpret_contract("drom")
    assert contract.kind == "dream"
    assert contract.label == "Drömläsning"
    assert contract.caution_level == "high"


def test_resolve_poem_contract():
    contract = _resolve_interpret_contract("dikt")
    assert contract.kind == "poem"
    assert contract.label == "Diktnärläsning"


def test_resolve_reflection_contract_for_other_categories():
    contract = _resolve_interpret_contract("vision")
    assert contract.kind == "reflection"
    assert contract.label == "Reflektionsläsning"


def test_supported_models_offer_modern_choices():
    model_ids = [model.id for model in SUPPORTED_MODELS]
    assert model_ids == ["gpt-4.1-mini", "gpt-4.1", "gpt-4o", "gpt-5-mini", "gpt-5"]


def test_normalize_model_accepts_supported_choice():
    assert _normalize_model("gpt-5-mini") == "gpt-5-mini"


def test_normalize_model_falls_back_to_supported_default():
    assert _normalize_model("gpt-3.5-turbo") == "gpt-4.1-mini"


def test_structure_ai_response_uses_contract_sections():
    contract = _resolve_interpret_contract("dikt")
    payload = {
        "sections": [
            {"id": "core_reading", "content": "Dikten kretsar kring en stilla förlust."},
            {"id": "imagery", "content": "Vatten och skugga bär mycket av spänningen."},
            {"id": "themes", "content": "Tema om avstånd och längtan."},
            {"id": "open_question", "content": "Vad lämnas avsiktligt outsagt?"},
            {"id": "caution", "content": "Detta är en möjlig läsning, inte facit."},
        ]
    }

    sections = _structure_ai_response(json.dumps(payload), contract)

    assert [section.id for section in sections] == [
        "core_reading",
        "imagery",
        "themes",
        "open_question",
        "caution",
    ]
    assert "Dikten kretsar" in _render_interpretation_text(sections)


def test_structure_ai_response_falls_back_when_json_missing():
    contract = _resolve_interpret_contract("reflektion")
    raw = "Första stycket.\n\nAndra stycket."

    sections = _structure_ai_response(raw, contract)

    assert sections[0].content == "Första stycket."
    assert sections[-1].title == "Försiktighet"
