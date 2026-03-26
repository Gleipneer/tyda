"""Kontrollerar att drömfallback ger sju sektioner och undermedvetet-lager för olika drömtyper."""
from app.routers.interpret import _dream_fallback_sections, _resolve_interpret_contract


def test_dream_fallback_seven_sections_and_unconscious_for_varied_dreams():
    contract = _resolve_interpret_contract("drom")
    samples = (
        "jag föll länge genom mörka schakt tills jag landade på vatten",
        "någon jagade mig genom skogen och jag tappade skorna",
        "ett vitt ljus fyllde rummet och en röst sade mitt namn mjukt",
    )
    for inn in samples:
        post = {"Innehall": inn, "Titel": "Dröm"}
        secs = _dream_fallback_sections(post, contract)
        assert len(secs) == 8
        ids = [s.id for s in secs]
        assert ids == [
            "summary",
            "dream_movement",
            "unconscious_message",
            "symbolic_lenses",
            "life_readings",
            "gentle_guidance",
            "reflection_prompt",
            "caution",
        ]
        unc = next(s for s in secs if s.id == "unconscious_message")
        assert "undermedvetna" in unc.content.lower()
