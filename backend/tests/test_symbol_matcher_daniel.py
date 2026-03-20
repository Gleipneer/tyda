"""
Golden case: symbolisk / profetisk text (Daniel 2-stil).
Verifierar tokenbaserad matchning + VARIANT (fötterna→fot, silvret→silver, m.m.).
Ingen databas krävs — in-memory begreppslista.
"""
from app.services.symbol_matcher import build_match_trace, find_matches, normalize_for_match, tokenize


# Fullständig testtext enligt spec (TESDATA)
DANIEL_TEXT = """
Källa: Daniel 2:31–35
Traditionell drömbärare: Kung Nebukadnessar
Typ: Symbolisk / profetisk kungadröm

Drömtext:
Jag såg en enorm staty stå framför mig.
Den var väldig, strålande och skrämmande till sin gestalt.

Huvudet var av rent guld.
Bröstet och armarna var av silver.
Buken och höfterna var av brons.
Benen var av järn.
Fötterna var en blandning av järn och lera.

Medan jag såg på detta,
lossnade en sten utan att någon människa högg ut den.
Stenen träffade statyn på fötterna,
de som bestod av järn och lera,
och krossade dem.

Därefter bröts hela statyn sönder:
järnet, leran, bronset, silvret och guldet.
Allt blev som agnar på en tröskplats om sommaren,
och vinden förde bort det,
så att inga spår fanns kvar.

Men stenen som träffade statyn
växte till ett stort berg
och uppfyllde hela jorden.
"""


def _minimal_lexicon_daniel():
    """Basord som migration 003+017 + befintliga listor ska innehålla."""
    words = [
        "berg",
        "sten",
        "guld",
        "silver",
        "brons",
        "järn",
        "lera",
        "vind",
        "fot",
        "huvud",
        "arm",
        "ben",
        "staty",
        "jord",
    ]
    return [{"BegreppID": i + 1, "Ord": w, "Beskrivning": "test"} for i, w in enumerate(words)]


def test_daniel_text_matches_many_concepts():
    concepts = _minimal_lexicon_daniel()
    matches = find_matches(DANIEL_TEXT, concepts, include_phrases=True)
    ords = {m["ord"] for m in matches}
    # Minst dessa ska träffas med nuvarande VARIANT + suffix
    expected_subset = {"berg", "sten", "guld", "silver", "brons", "järn", "lera", "vind", "fot", "huvud", "arm", "ben", "staty", "jord"}
    missing = expected_subset - ords
    assert not missing, f"Saknade förväntade begrepp: {missing}, fick: {ords}"


def test_match_trace_structure():
    concepts = _minimal_lexicon_daniel()
    trace = build_match_trace(DANIEL_TEXT, concepts)
    assert trace["token_count"] > 50
    assert trace["match_count"] == len(trace["matches"])
    assert isinstance(trace["per_token"], list)
    assert all("token" in t and "candidates" in t for t in trace["per_token"])


def test_normalize_jarn_equals_storage():
    """Samma nyckel oavsett om lexikon lagrar järn eller jarn (normalisering)."""
    assert normalize_for_match("järn") == normalize_for_match("jarn")
    assert normalize_for_match("JÄRN") == "jarn"


def test_tokenize_keeps_swedish_chars():
    toks = tokenize("Guld, silver — järn!")
    lower = [t.lower() for t in toks]
    assert "guld" in lower and "silver" in lower and "järn" in lower


def test_fotter_maps_to_fot():
    concepts = [
        {"BegreppID": 1, "Ord": "fot", "Beskrivning": "x"},
    ]
    m = find_matches("Fötterna stod i leran.", concepts)
    assert len(m) >= 1
    assert m[0]["ord"] == "fot"
    assert "fötterna" in m[0]["matched_token"].lower() or m[0]["matched_token"].lower() == "fötterna"


def test_silvret_maps_to_silver():
    concepts = [{"BegreppID": 2, "Ord": "silver", "Beskrivning": "x"}]
    m = find_matches("silvret skimrade.", concepts)
    assert m and m[0]["ord"] == "silver"


def test_leran_maps_to_lera():
    concepts = [{"BegreppID": 3, "Ord": "lera", "Beskrivning": "x"}]
    m = find_matches("leran var mjuk.", concepts)
    assert m and m[0]["ord"] == "lera"
