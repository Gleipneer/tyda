from app.schemas.interpret import InterpretationSection
from app.services.interpret_postprocess import (
    postprocess_interpretation_sections,
    refine_dream_section_content,
    trim_caution_brief,
    trim_reflection_questions_content,
    trim_symbolic_lenses_content,
)


def test_refine_drops_unanchored_generic_sentence():
    dream = "jag drömde om en violett drake och ett panoramafönster"
    raw = (
        "Du möter det okända i en inre resa. "
        "Draken ligger vid taket medan du ser ut genom fönstret."
    )
    out = refine_dream_section_content(raw, dream)
    assert "det okända" not in out.lower()
    assert "inre resa" not in out.lower()
    assert "draken" in out.lower() or "fönstret" in out.lower()


def test_postprocess_skips_non_dream():
    sections = [
        InterpretationSection(id="core_reading", title="X", content="Y"),
    ]
    same = postprocess_interpretation_sections(sections, source_text="z", kind="poem")
    assert same[0].content == "Y"


def test_trim_symbolic_lenses_keeps_at_most_two_titled_blocks():
    raw = (
        "Första linsen:\n"
        "Text en.\n\n"
        "Andra linsen:\n"
        "Text två.\n\n"
        "Tredje linsen:\n"
        "Text tre."
    )
    out = trim_symbolic_lenses_content(raw, max_blocks=2)
    assert "Första" in out
    assert "Andra" in out
    assert "Tredje" not in out


def test_trim_reflection_questions_max_two():
    raw = "Första frågan?\n\nAndra frågan?\n\nTredje frågan?"
    out = trim_reflection_questions_content(raw, max_questions=2)
    assert out.count("?") == 2
    assert "Tredje" not in out


def test_trim_caution_one_sentence():
    raw = "Detta är en möjlig tolkning. Inte fakta. Mer text."
    out = trim_caution_brief(raw, max_sentences=1)
    assert out == "Detta är en möjlig tolkning."
    assert "Inte fakta" not in out


def test_postprocess_dream_trims_symbolic_reflection_caution():
    src = "jag drömde om en röd dörr och en skog"
    sections = [
        InterpretationSection(id="symbolic_lenses", title="S", content="A:\nEtt.\n\nB:\nTvå.\n\nC:\nTre."),
        InterpretationSection(
            id="reflection_prompt", title="R", content="Fråga ett? Fråga två? Fråga tre?"
        ),
        InterpretationSection(id="caution", title="F", content="Men ett. Men två."),
    ]
    out = postprocess_interpretation_sections(sections, source_text=src, kind="dream")
    by_id = {s.id: s.content for s in out}
    assert "C:" not in by_id["symbolic_lenses"]
    assert by_id["reflection_prompt"].count("?") == 2
    assert by_id["caution"] == "Men ett."
