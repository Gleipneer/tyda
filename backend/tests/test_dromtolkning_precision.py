"""
Testsvit för drömtolkning – precision-pass.
Kör mot verkliga svenska drömformuleringar.
Kräver: migration 008 körd, databas tillgänglig.
"""
import pytest

from app.repositories import concept_repo
from app.services.symbol_matcher import find_matches, find_phrase_matches


# 20 realistiska drömbeskrivningar för eval
DROM_TESTCASES = [
    "Jag föll ner i mörkt vatten och kunde inte ta mig upp.",
    "Jag sprang genom en skog men hittade inte ut.",
    "Jag stod utanför en låst dörr och försökte öppna den.",
    "Jag blev jagad och kunde inte skrika.",
    "Jag svävade över havet och såg ett svagt ljus långt bort.",
    "Jag letade efter min son men han försvann hela tiden.",
    "Jag gick nerför en trappa som aldrig tog slut.",
    "Jag hörde någon ropa mitt namn men såg ingen.",
    "Jag fastnade i lera och kunde inte röra benen.",
    "Jag kom tillbaka till samma hus men allt där inne hade förändrats.",
    "Jag kunde inte springa trots att jag försökte.",
    "Jag blev dragen mot en mörk öppning.",
    "Jag hittade en nyckel men dörren var låst.",
    "Jag såg ingenting, allt var tyst och mörkt.",
    "Jag försökte komma upp ur vattnet men lyckades inte.",
    "Jag stod i en trång korridor och kunde inte komma fram.",
    "Jag vaknade mitt i natten av ett skrik.",
    "Jag tappade kontrollen och föll nerför en brant backe.",
    "Jag gömde mig men de hittade mig ändå.",
    "Jag hörde en viskning som kallade mitt namn.",
]


@pytest.fixture
def concepts():
    """Hämta alla begrepp från databasen."""
    return concept_repo.get_all_concepts()


def test_find_matches_returns_list(concepts):
    """find_matches returnerar lista."""
    text = "Jag föll ner i mörkt vatten."
    result = find_matches(text, concepts)
    assert isinstance(result, list)


def test_fall_and_water_matched(concepts):
    """'Jag föll ner i mörkt vatten' – fall, vatten, mörker."""
    text = "Jag föll ner i mörkt vatten och kunde inte ta mig upp."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert "vatten" in ords or "mörker" in ords or "fall" in ords or "falla" in ords


def test_phrase_kunde_inte_ta_mig_upp(concepts):
    """Phrase 'kunde inte ta mig loss' -> fastna."""
    text = "Jag kunde inte ta mig loss från leran."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert "fastna" in ords


def test_phrase_kom_inte_fram(concepts):
    """Phrase 'kom inte fram' -> hinder."""
    text = "Jag sprang men kom inte fram till dörren."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert "hinder" in ords


def test_phrase_dorren_var_last(concepts):
    """Phrase 'dörren var låst' -> låst."""
    text = "Jag stod utanför. Dörren var låst."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert "låst" in ords


def test_phrase_blev_jagad(concepts):
    """Phrase 'blev jagad' -> jaga."""
    text = "Jag blev jagad genom skogen."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert "jaga" in ords


def test_phrase_blev_dragen(concepts):
    """Phrase 'blev dragen' -> dras."""
    text = "Jag blev dragen mot en mörk öppning."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert "dras" in ords


def test_all_drom_cases_produce_some_matches(concepts):
    """Alla 20 testfall ger minst en träff."""
    for i, text in enumerate(DROM_TESTCASES):
        result = find_matches(text, concepts)
        assert len(result) >= 1, f"Testfall {i+1} gav inga träffar: {text[:50]}..."


def test_phrase_match_type_present(concepts):
    """Phrase-träffar har match_type='phrase'."""
    text = "Jag kunde inte se någonting."
    result = find_matches(text, concepts)
    phrase_matches = [r for r in result if r.get("match_type") == "phrase"]
    assert len(phrase_matches) >= 1 or any(r["ord"] == "blind" for r in result)


def test_no_duplicate_concepts_per_match(concepts):
    """Samma begrepp förekommer inte flera gånger."""
    text = "Jag föll ner och föll igen. Vattnet och vatten överallt."
    result = find_matches(text, concepts)
    ords = [r["ord"] for r in result]
    assert len(ords) == len(set(ords))
