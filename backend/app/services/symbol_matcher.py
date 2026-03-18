"""
Symbolmatcher – automatisk matchning av text mot Begrepp-biblioteket.

Deterministisk, regelbaserad. Mellanlagret bär komplexiteten; databasen är kunskapskälla.
Hanterar:
- normalisering (lowercase, diakritika)
- svenska böjningsformer
- synonymmappning (mor->moder, mörk->mörker)
- relaterade ord via kluster (sot->eld, våg->hav)
- scoring och prioritering (exakt > böjning > synonym > relaterad)
- deduplicering (bästa träff per begrepp)
- explainability (matched_token, match_type, score)
"""
import re
import unicodedata
from typing import Any

# Poäng per matchtyp (högre = bättre träff)
SCORE_EXACT = 100
SCORE_INFLECTED = 90
SCORE_SYNONYM = 80
SCORE_RELATED = 60
SCORE_PHRASE = 95  # Frasmatch – hög trovärdighet

# Svenska suffix (längst först)
SWEDISH_SUFFIXES = [
    "arna", "erna", "orna", "ena", "na",
    "en", "et", "ar", "or", "er", "n", "t", "a", "e",
]

# Symbolkluster: ord som mappas till huvudbegrepp (ord som INTE finns i Begrepp)
# Används för relaterade ord – t.ex. "bränna" finns inte, mappas till "eld"
SYMBOL_CLUSTERS: dict[str, list[str]] = {
    "eld": ["bränna", "brände", "brinner", "brann", "glöd", "glöden"],
    "vatten": ["dusch", "bad", "simma"],
    "hav": ["våg", "vågor", "vågorna", "havsvågor"],
    "ljus": ["gryning", "gryningen", "soluppgång"],
    "mörker": ["skymning", "skymningen", "solnedgång"],
    "orm": ["ömsa", "ömsar", "ömsade", "ömsat"],
    "in": ["inuti", "inifrån"],
    "ut": ["utanför", "utifrån"],
    "upp": ["uppe", "uppåt"],
    "ner": ["nere", "nedåt"],
    "kontroll": ["styra", "styrning"],
    "fall": ["falla", "faller", "föll", "fallit"],
    "fly": ["flydde", "flyr", "flugit"],
    "jaga": ["jagade", "jagar", "jagat"],
}

# Phrase-level: mönster -> begrepp. Betydelsen uppstår i frasen.
# (regex, begrepp_ord). Begrepp måste finnas i databasen.
PHRASE_RULES: list[tuple[str, str]] = [
    # Negation / misslyckande
    (r"kunde\s+inte\s+se", "blind"),
    (r"kunde\s+inte\s+hitta", "hinder"),
    (r"kunde\s+inte\s+springa", "misslyckas"),
    (r"kunde\s+inte\s+röra\s+mig", "fastna"),
    (r"kunde\s+inte\s+skrika", "misslyckas"),
    (r"kom\s+inte\s+fram", "hinder"),
    (r"kom\s+inte\s+in", "hinder"),
    (r"hittade\s+inte\s+ut", "hinder"),
    (r"gick\s+inte\s+att\s+öppna", "låst"),
    (r"såg\s+inget", "blind"),
    (r"försökte\s+men\s+(det\s+)?gick\s+inte", "misslyckas"),
    (r"ville\s+men\s+kunde\s+inte", "misslyckas"),
    (r"dörren\s+(var\s+)?låst", "låst"),
    (r"dörren\s+öppnades\s+inte", "låst"),
    # Tvång / passivitet
    (r"blev\s+dragen", "dras"),
    (r"blev\s+jagad", "jaga"),
    (r"blev\s+kvar", "fastna"),
    (r"tvingades", "tvingas"),
    (r"hölls\s+fast", "fastna"),
    (r"fastnade\s+i", "fastna"),
    (r"sprang\s+ifrån", "fly"),
    (r"sprang\s+iväg", "fly"),
    (r"drogs\s+mot", "dras"),
    (r"kunde\s+inte\s+ta\s+mig\s+loss", "fastna"),
    # Rörelse / fall
    (r"föll\s+ner", "fall"),
    (r"föll\s+ner\s+i", "fall"),
    (r"ramlade\s+ner", "ramla"),
    (r"sjönk\s+ner", "sjunka"),
    (r"drogs\s+ner", "dras"),
    (r"halkade\s+ner", "halka"),
    # Uppåt / räddning
    (r"gick\s+upp", "stiga"),
    (r"tog\s+mig\s+upp", "lyfta"),
    (r"försökte\s+komma\s+upp", "stiga"),
    (r"klättrade\s+upp", "klättra"),
    (r"kom\s+upp", "stiga"),
    (r"lyfte\s+från\s+marken", "lyfta"),
    # Passage / gräns
    (r"gick\s+igenom", "passera"),
    (r"kom\s+in\s+i", "in"),
    (r"kom\s+ut\s+ur", "ut"),
    (r"stod\s+utanför", "ut"),
    (r"kom\s+inte\s+igenom", "hinder"),
    # Sensorik / orientering
    (r"såg\s+ingenting", "blind"),
    (r"hörde\s+någon\s+ropa", "ropa"),
    (r"hörde\s+ett\s+skrik", "skrik"),
    (r"allt\s+var\s+tyst", "tystnad"),
    (r"det\s+var\s+dimmigt", "dimma"),
    (r"det\s+var\s+suddigt", "suddig"),
    # Förlust / tappa bort
    (r"tappade\s+bort", "förlora"),
    (r"tappat\s+bort", "förlora"),
]

# Bygg RELATED_TO_BASE från kluster (ord som inte är i Begrepp)
def _build_related_from_clusters() -> dict[str, str]:
    out: dict[str, str] = {}
    for base, words in SYMBOL_CLUSTERS.items():
        for w in words:
            out[w] = base
    return out

# Ytterligare relaterade ord (utöver kluster)
_EXTRA_RELATED: dict[str, str] = {
    "sot": "eld",  # sot finns i Begrepp men användaren kan skriva "sot" som relaterat till eld
}
# OBS: sot, rök, regn, snö finns nu i Begrepp – använd böjningar istället

# Variant→grundform ( böjningsformer)
VARIANT_TO_BASE: dict[str, str] = {
    "ormar": "orm", "ormen": "orm", "ormens": "orm",
    "vattnet": "vatten", "vattnets": "vatten", "vattens": "vatten",
    "mörkret": "mörker", "mörkrets": "mörker", "mörkra": "mörker",
    "svärta": "svart", "svarta": "svart", "svartare": "svart",
    "askan": "aska", "askans": "aska", "askor": "aska",
    "elden": "eld", "elds": "eld", "eldar": "eld",
    "templet": "tempel", "templen": "tempel", "tempels": "tempel",
    "resan": "resa", "resor": "resa", "resorna": "resa",
    "vägen": "väg", "vägar": "väg", "vägarna": "väg",
    "skogen": "skog", "skogar": "skog", "skogarna": "skog",
    "huset": "hus", "husen": "hus", "husens": "hus",
    "dörren": "dörr", "dörrar": "dörr", "dörrarna": "dörr",
    "nyckeln": "nyckel", "nycklar": "nyckel", "nycklarna": "nyckel",
    "havet": "hav", "havens": "hav", "havs": "hav",
    "floden": "flod", "floder": "flod", "floderna": "flod",
    "kyrkan": "kyrka", "kyrkor": "kyrka", "kyrkorna": "kyrka",
    "ljuset": "ljus", "ljusens": "ljus",
    "natten": "natt", "nätter": "natt", "nätterna": "natt",
    "himlen": "himmel", "himlarna": "himmel",
    "jorden": "jord", "jordens": "jord",
    "modern": "moder", "mödrar": "moder", "mödrarna": "moder",
    "barnet": "barn", "barnen": "barn", "barnens": "barn",
    "spegeln": "spegel", "speglar": "spegel", "speglarna": "spegel",
    "trappan": "trappa", "trappor": "trappa", "trapporna": "trappa",
    "berget": "berg", "bergen": "berg", "bergens": "berg",
    "fågeln": "fågel", "fåglar": "fågel", "fåglarna": "fågel",
    "hunden": "hund", "hundar": "hund", "hundarna": "hund",
    "katten": "katt", "katter": "katt", "katterna": "katt",
    "blodet": "blod", "blodets": "blod",
    "kronan": "krona", "kronor": "krona", "kronorna": "krona",
    "ringen": "ring", "ringar": "ring", "ringarna": "ring",
    "stormen": "storm", "stormar": "storm", "stormarna": "storm",
    "bron": "bro", "broar": "bro", "broarna": "bro",
    "fönstret": "fönster", "fönster": "fönster", "fönstren": "fönster",
    "graven": "grav", "gravar": "grav", "gravarna": "grav",
    "döden": "död", "döds": "död",
    "födelsen": "födelse", "födelsens": "födelse",
    "ömsa": "ömsning", "ömsar": "ömsning", "ömsade": "ömsning", "ömsat": "ömsning",
    "drömmar": "dröm", "drömmen": "dröm", "drömmens": "dröm",
    "drömde": "dröm", "drömda": "dröm", "drömt": "dröm", "drömmer": "dröm",
    "fadern": "fader", "fäder": "fader", "fäderna": "fader",
    "fiskar": "fisk", "fisken": "fisk", "fiskarna": "fisk",
    "stenen": "sten", "stenar": "sten", "stenarna": "sten",
    "trädet": "träd", "träd": "träd", "träden": "träd",
    "blomman": "blomma", "blommor": "blomma", "blommorna": "blomma",
    "sjön": "sjö", "sjöar": "sjö", "sjöarna": "sjö",
    "solen": "sol", "solar": "sol",
    "månen": "måne", "månar": "måne", "månarna": "måne", "manen": "måne",
    "röda": "röd", "rött": "röd", "rödare": "röd",
    "blåa": "blå", "blått": "blå", "blåare": "blå",
    "gröna": "grön", "grönt": "grön", "grönare": "grön",
    # Nya från expansion
    "regnet": "regn", "regnen": "regn",
    "snön": "snö", "snöar": "snö",
    "röken": "rök", "rökar": "rök",
    "flammor": "flamma", "flammorna": "flamma",
    "gryningen": "gryning",
    "skymningen": "skymning",
    "vinden": "vind", "vindar": "vind",
    "isen": "is", "isar": "is",
    "stjärnorna": "stjärna", "stjärnor": "stjärna",
    "molnen": "moln", "moln": "moln",
    "hästar": "häst", "hästen": "häst", "hästarna": "häst",
    "vargar": "varg", "vargen": "varg",
    "björnar": "björn", "björnen": "björn",
    "rummen": "rum", "rummet": "rum",
    "dörren": "dörr", "dörrar": "dörr",
    "boken": "bok", "böcker": "bok", "böckerna": "bok",
    "sängen": "säng", "sängar": "säng",
    "båten": "båt", "båtar": "båt", "båtarna": "båt",
    "nyckeln": "nyckel", "nycklar": "nyckel",
    "vägvisaren": "vägvisare", "vägvisare": "vägvisare",
    "främlingen": "främling", "främlingar": "främling",
    "kungen": "kung", "kungar": "kung", "kungarna": "kung",
    "drottningen": "drottning", "drottningar": "drottning",
    "faller": "fall", "föll": "fall", "fallit": "fall",
    "vattenfallet": "vattenfall", "vattenfall": "vattenfall",
    "labyrinten": "labyrint", "labyrinter": "labyrint",
    "cirkeln": "cirkel", "cirklar": "cirkel",
    "centrum": "centrum",
    "frön": "frö", "fröt": "frö",
    "rötter": "rot", "roten": "rot",
    "känslor": "känsla", "känslan": "känsla", "känslorna": "känsla", "känsloliv": "känsla",
    # 005_lexicon_extended
    "rädslan": "rädsla", "rädslor": "rädsla", "rädslorna": "rädsla",
    "hoppet": "hopp", "hoppens": "hopp",
    "längtans": "längtan", "längtar": "längtan",
    "sorgen": "sorg", "sorger": "sorg", "sorgerna": "sorg",
    "glädjen": "glädje", "glädjer": "glädje", "glädjerna": "glädje",
    "vrede": "vrede", "vreden": "vrede",
    "tryggheten": "trygghet", "tryggheter": "trygghet",
    "ångesten": "ångest", "ångest": "ångest",
    "ansiktet": "ansikte", "ansikten": "ansikte",
    "ryggen": "rygg", "ryggar": "rygg", "ryggarna": "rygg",
    "munnen": "mun", "munnar": "mun", "munnarna": "mun",
    "armen": "arm", "armar": "arm", "armarna": "arm",
    "benen": "ben", "benet": "ben", "ben": "ben",
    "springer": "springa", "sprang": "springa", "sprungit": "springa", "springande": "springa",
    "går": "gå", "gick": "gå", "gått": "gå", "gående": "gå",
    "nedstigning": "nedstigning", "nedstigningens": "nedstigning",
    "gränsen": "gräns", "gränser": "gräns", "gränserna": "gräns",
    "vakten": "vakt", "vakter": "vakt", "vakterna": "vakt",
    "skyddet": "skydd", "skydd": "skydd", "skydden": "skydd",
    "varningen": "varning", "varningar": "varning", "varningarna": "varning",
    "stillheten": "stillhet", "stillhet": "stillhet",
    "misten": "mist", "mistar": "mist",
    "forsar": "fors", "forsen": "fors", "forsarna": "fors",
    "blåsten": "blåst", "blåst": "blåst",
    "räven": "räv", "rävar": "räv", "rävarna": "räv",
    "råttan": "råtta", "råttor": "råtta", "råttorna": "råtta",
    "ekorren": "ekorre", "ekorrar": "ekorre", "ekorrarna": "ekorre",
    "ugglan": "uggla", "ugglor": "uggla", "ugglorna": "uggla",
    "förändringen": "förändring", "förändringar": "förändring",
    "avslutet": "avslut", "avslut": "avslut", "avsluten": "avslut",
    "började": "början", "börjat": "början",
    # 007_lexicon_dromtolkning – riktningar, rörelse, vertikalitet
    "norra": "norr", "nordlig": "nord", "nordliga": "nord",
    "södra": "söder", "sydlig": "syd", "sydliga": "syd",
    "östra": "öst", "östlig": "öst",
    "västra": "väst", "västlig": "väst",
    "föll": "falla", "faller": "falla", "fallit": "falla",
    "ramlade": "ramla", "ramlar": "ramla", "ramlat": "ramla",
    "steg": "stiga", "stiger": "stiga", "stigit": "stiga",
    "sjönk": "sjunka", "sjunker": "sjunka", "sjunkit": "sjunka",
    "svävade": "sväva", "svävar": "sväva", "svävat": "sväva",
    "flög": "flyga", "flyger": "flyga", "flugit": "flyga",
    "klättrade": "klättra", "klättrar": "klättra",
    "rusade": "rusa", "rusar": "rusa",
    "kryper": "krypa", "kröp": "krypa", "krupit": "krypa",
    "smög": "smyga", "smyger": "smyga",
    "jagade": "jaga", "jagar": "jaga",
    "flydde": "fly", "flyr": "fly",
    "vandrade": "vandra", "vandrar": "vandra",
    "snubblade": "snubbla", "snubblar": "snubbla",
    "dragen": "dras",
    "drev": "driva", "driver": "driva", "drivit": "driva",
    "dök": "dyka", "dyker": "dyka", "dykt": "dyka",
    "kastade": "kasta", "kastar": "kasta",
    "slungades": "slungas", "snurrade": "snurra", "snurrar": "snurra",
    "öppnade": "öppna", "öppnar": "öppna",
    "stängde": "stänga", "stänger": "stänga",
    "passerade": "passera", "passerar": "passera",
    "blockerad": "blockeras", "blockerat": "blockeras",
    "fastnade": "fastna", "fastnar": "fastna", "fastnat": "fastna",
    "halkade": "halka", "halkar": "halka",
    "tappade": "tappa", "tappar": "tappa",
    "släppte": "släppa", "släpper": "släppa", "släppt": "släppa",
    "vinglade": "vingla", "vinglar": "vingla",
    "lyckades": "lyckas", "lyckas": "lyckas",
    "misslyckades": "misslyckas", "misslyckas": "misslyckas",
    "drunknade": "drunkna", "drunknar": "drunkna",
    "flöt": "flyta", "flyter": "flyta", "flutit": "flyta",
    "följde": "följa", "följer": "följa",
    "ledde": "leda", "leder": "leda",
    "lämnade": "lämna", "lämnar": "lämna",
    "återvände": "återvända", "återvänder": "återvända",
    "mötte": "möta", "möter": "möta",
    "gömde": "gömma", "gömmer": "gömma", "gömt": "gömma", "gömma sig": "gömma",
    # 008_precision – drömverb, hinder, sensorik
    "hittade": "hitta", "hittar": "hitta", "hittat": "hitta",
    "letade": "leta", "letar": "leta", "letat": "leta",
    "försvann": "försvinna", "försvinner": "försvinna", "försvunnit": "försvinna",
    "vaknade": "vakna", "vaknar": "vakna", "vaknat": "vakna",
    "somnade": "somna", "somnar": "somna", "somnat": "somna",
    "skrek": "skrika", "skriker": "skrika", "skrikit": "skrika",
    "ropade": "ropa", "ropar": "ropa", "ropat": "ropa",
    "hörde": "höra", "hör": "höra", "hört": "höra",
    "viskade": "viska", "viskar": "viska", "viskat": "viska",
    "förlorade": "förlora", "förlorar": "förlora", "förlorat": "förlora",
    "hindren": "hinder", "hinder": "hinder",
    "låste": "låsa", "låser": "låsa", "låst": "låst",
    "trasiga": "trasig", "trasigt": "trasig",
    "smala": "smal", "smalt": "smal", "smalare": "smal",
    "breda": "bred", "bredare": "bred",
    "hala": "hal", "halt": "hal",
    "branta": "brant", "brantare": "brant",
    "trånga": "trång", "trångt": "trång",
    "ignorerade": "ignorera", "ignorerar": "ignorera",
    "kallade": "kalla", "kallar": "kalla",
    "räddade": "rädda", "räddar": "rädda",
    "hotade": "hota", "hotar": "hota",
}

# Synonymer → grundform (nycklar normaliseras vid lookup)
SYNONYM_TO_BASE: dict[str, str] = {
    "drömmar": "dröm", "drömmen": "dröm", "drömt": "dröm", "drömde": "dröm",
    "mörk": "mörker", "mörkt": "mörker", "mörka": "mörker", "morkt": "mörker", "morka": "mörker",
    "svartare": "svart", "svartast": "svart",
    "vitare": "vit", "vitast": "vit",
    "mor": "moder", "mors": "moder",
    "far": "fader", "fars": "fader", "faderns": "fader",
    "rädd": "rädsla", "rädda": "rädsla",
    "glad": "glädje", "glatt": "glädje", "glada": "glädje",
    "arg": "vrede", "argt": "vrede", "arga": "vrede",
    "lugn": "stillhet", "lugnt": "stillhet", "lugna": "stillhet",
    "stilla": "stillhet", "stillt": "stillhet",
    "norra": "norr", "nordlig": "nord", "södra": "söder", "sydlig": "syd",
    "östra": "öst", "östlig": "öst", "västra": "väst", "västlig": "väst",
    "ljust": "ljus", "mörkt": "mörker",
}
# OBS: flamma finns i Begrepp – ta bort flamma/flammor från synonym om vi vill ha flamma som eget
# Vi behåller flamma som eget begrepp; VARIANT_TO_BASE har flammor->flamma

# Relaterade ord (ord som inte finns i Begrepp, mappas till begrepp)
RELATED_TO_BASE: dict[str, str] = {
    **_build_related_from_clusters(),
    **_EXTRA_RELATED,
    "våg": "hav", "vågor": "hav", "vågorna": "hav",
}


def normalize_for_match(text: str) -> str:
    """Normaliserar text: lowercase, trim, ta bort diakritika."""
    if not text:
        return ""
    t = text.lower().strip()
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return t


def tokenize(text: str) -> list[str]:
    """Delar text i ord (alfanumeriskt + svenska tecken)."""
    if not text:
        return []
    return re.findall(r"[a-zA-ZåäöÅÄÖ0-9]+", text)


def reduce_to_base(word: str) -> list[tuple[str, str]]:
    """
    Returnerar möjliga (grundform, matchtyp).
    matchtyp: "exact" | "inflected" | "synonym" | "related"
    """
    w = normalize_for_match(word)
    candidates: list[tuple[str, str]] = [(w, "exact")]

    # Lookup med normaliserad nyckel (åäö tas bort vid matchning)
    def _get(d: dict[str, str], key: str) -> str | None:
        if key in d:
            return d[key]
        return None

    v = _get(VARIANT_TO_BASE, w) or next(
        (VARIANT_TO_BASE[k] for k in VARIANT_TO_BASE if normalize_for_match(k) == w), None
    )
    if v:
        candidates.append((v, "inflected"))
    s = _get(SYNONYM_TO_BASE, w) or next(
        (SYNONYM_TO_BASE[k] for k in SYNONYM_TO_BASE if normalize_for_match(k) == w), None
    )
    if s:
        candidates.append((s, "synonym"))
    r = _get(RELATED_TO_BASE, w) or next(
        (RELATED_TO_BASE[k] for k in RELATED_TO_BASE if normalize_for_match(k) == w), None
    )
    if r:
        candidates.append((r, "related"))

    for suffix in SWEDISH_SUFFIXES:
        if w.endswith(suffix) and len(w) > len(suffix) + 1:
            stem = w[: -len(suffix)]
            candidates.append((stem, "inflected"))

    return candidates


def _score_for_match_type(match_type: str) -> int:
    return {
        "exact": SCORE_EXACT,
        "inflected": SCORE_INFLECTED,
        "synonym": SCORE_SYNONYM,
        "related": SCORE_RELATED,
        "phrase": SCORE_PHRASE,
    }.get(match_type, SCORE_RELATED)


def find_phrase_matches(
    text: str,
    concepts: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Matchar frasmönster mot text. Returnerar phrase-träffar.
    Används tillsammans med find_matches för bättre semantisk täckning.
    """
    ord_to_concept = {normalize_for_match(c["Ord"]): c for c in concepts}
    result: list[dict[str, Any]] = []
    text_lower = text.lower()

    for pattern, concept_ord in PHRASE_RULES:
        key = normalize_for_match(concept_ord)
        if key not in ord_to_concept:
            continue
        m = re.search(pattern, text_lower, re.IGNORECASE)
        if m:
            c = ord_to_concept[key]
            result.append({
                "begrepp_id": c["BegreppID"],
                "ord": c["Ord"],
                "beskrivning": c["Beskrivning"],
                "matched_token": m.group(0),
                "match_type": "phrase",
                "score": SCORE_PHRASE,
            })
    return result


def find_matches(
    text: str,
    concepts: list[dict[str, Any]],
    include_phrases: bool = True,
) -> list[dict[str, Any]]:
    """
    Matchar text mot begrepp. Returnerar träffar sorterade efter score.
    Deduplicering: bästa träff per begrepp.
    Explainability: matched_token, match_type, score.
    Om include_phrases=True (default) inkluderas phrase-level matchning.
    """
    tokens = tokenize(text)
    ord_to_concept = {normalize_for_match(c["Ord"]): c for c in concepts}
    seen: dict[int, tuple[int, dict[str, Any]]] = {}

    for token in tokens:
        for base_form, match_type in reduce_to_base(token):
            key = normalize_for_match(base_form)
            if key in ord_to_concept:
                c = ord_to_concept[key]
                cid = c["BegreppID"]
                score = _score_for_match_type(match_type)
                if cid not in seen or score > seen[cid][0]:
                    seen[cid] = (score, {
                        "begrepp_id": c["BegreppID"],
                        "ord": c["Ord"],
                        "beskrivning": c["Beskrivning"],
                        "matched_token": token,
                        "match_type": match_type,
                        "score": score,
                    })

    if include_phrases:
        for pm in find_phrase_matches(text, concepts):
            cid = pm["begrepp_id"]
            score = pm["score"]
            if cid not in seen or score > seen[cid][0]:
                seen[cid] = (score, pm)

    result = [info for _, info in seen.values()]
    result.sort(key=lambda x: (-x["score"], x["ord"]))
    return result
