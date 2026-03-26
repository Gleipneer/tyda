"""
AI-tolkning av poster – server-side, advisory lager.
API-nyckel i miljövariabel, aldrig exponerad till klienten.
Använder automatchade begrepp och phrase-signaler för bättre underlag.
"""
import json
import logging
import re
import unicodedata
from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.deps import get_current_user_id
from app.db import get_connection
from app.repositories import concept_repo, post_repo
from app.schemas.interpret import (
    InterpretResponse,
    InterpretStatus,
    InterpretationContract,
    InterpretationSection,
)
from app.services.interpret_models import (
    allowed_model_objects,
    default_model_id,
    resolve_requested_model_id,
)
from app.services.interpret_postprocess import postprocess_interpretation_sections
from app.services.openai_interpret_chat import create_interpret_chat_completion
from app.services.symbol_matcher import find_matches

logger = logging.getLogger(__name__)
router = APIRouter()

DISCLAIMER_TEXT = (
    "Detta är en AI-tolkning — en möjlig läsning, inte en definitiv sanning. "
    "Den ersätter varken professionell vård, terapi eller andlig vägledning."
)

# Tillägg till systemprompten endast för drömkontraktet (undermedvetet som tolkningsram, inte sanning).
DREAM_SYSTEM_ADDON = """
ARBETSPREMISS — DRÖMMAR SOM MÖJLIGA UTTRYCK FRÅN DET UNDERMEDVETNA:
- Behandla drömmen som ett möjligt budskap från det som i människan ännu inte är fullt tänkt, känt eller integrerat.
- Du tolkar vad det undermedvetna kan försöka visa — aldrig som bevis, auktoritet eller spådom.
- Prioritera läsbarhet och kognitiv lätthet: skarpt, bärande, lugnt — inte långa essäer. Hellre en tydlig kärna än många sidospår.

BALANS MELLAN SEKTIONER (VIKTIG ORDNING):
- Tyngdpunkten ska ligga i «Möjligt budskap från det undermedvetna», «Möjlig livsbäring» och «Varsam vägledning».
- «Möjliga symboliska läsningar» (symbolic_lenses) är SEKUNDÄRT: färre ord, färre traditioner — se separat block.
- Undvik att upprepa hela drömmen om du redan sagt det i sammanfattning eller «Vad drömmen gör».

LAGER DU SKA FYLLA I JSON-SEKTIONERNA:
1) Kort sammanfattning: max 2–4 meningar, bara kärnan.
2) Vad drömmen gör: ett kort stycke (ev. två mycket korta): rörelse och de viktigaste bildernas *funktion* — inte repris av allt som hänt.
3) Möjligt budskap från det undermedvetna: HUVUDSEKTION — 1–2 stycken, en tydlig kärna; hellre en stark linje än många lösa hypoteser.
4) Möjliga symboliska läsningar: bara om det tillför nytta — max 0–2 linser, kort — se separat block.
5) Möjlig livsbäring: kort och konkret: hur det kan spegla livet *nu*, hypotetiskt.
6) Varsam vägledning: kort, varmt, användbart — hellre 2–4 meningar än lång text; inga order.
7) Att bära med dig / öppna frågor: max 1–2 frågor, bara om de verkligen bär; annars en enda bra fråga.
8) Försiktighet: en kort avslutande rad (en mening räcker) — möjlig läsning, inte fakta; ingen teologisk eller medicinsk auktoritet.

SPRÅK DU ALDRIG FÅR ANVÄNDA SOM SANNING:
- "ditt undermedvetna säger definitivt att", "drömmen bevisar", "detta är sanningen om dig", "du måste".

SPRÅK SOM PASSAR:
- "om drömmen förstås som … kan den peka mot …", "det kan vara som att …", "en djupare del av dig kan försöka visa …", "drömmen kan spegla …".

UNDVIK TOM FLUFF (om inte omedelbart förankrat i drömmens scener):
det okända, inre resa, mystik, transformation, förändring som tom etikett.

TON: varm, lugn, människokunnig — tydlig vardagssvenska där det räcker; specialtermer bara när de verkligen hjälper läsaren. Inte mekanisk terapeut, inte new age-flum, inte psykologiskt tvärsäker.
"""

DREAM_SYMBOLIC_LENS_ADDON = """
SYMBOLISKA LINSELLAGER (JSON-fältet symbolic_lenses — SEKUNDÄRT till budskap/livsbäring/vägledning):
- Standard: 0–2 linser. Utelämna helt om inget tillför mer än undermedvetet budskap redan sagt.
- Hellre 1 mycket träffsäker lins än 3–4 halvstarka. Om en tradition bara blir namn-droppande: skippa den.
- ALDRIG auktoritativ teologi eller sanning om drömmaren. Formulera: "kan likna …", "kan påminna om …", "skulle kunna läsas som …".
- Nämn inte att en gestalt "är" en gud, helgon eller mytisk figur vid namn — endast *likhet* eller *närhet* i symbolspråk.
- Rubrik på egen rad (kort, t.ex. "Jungianskt (hypotetiskt):") sedan 1–3 kompakta meningar per lins. Inga långa utläggningar.
- FUNKTION först i själva meningen: vad gestalten *gör* i drömmen; undvik lärd terminologi som kräver egen förklaring.
- INGEN kravlista över traditioner att "täcka". Välj bara det som är starkast för just denna dröm.
- Inga rituella instruktioner eller esoteriska recept — endast reflekterande hypoteser.
"""


@dataclass(frozen=True)
class SectionSpec:
    """Intern kontraktsspec för varje del i svaret."""

    id: str
    title: str
    instruction: str


@dataclass(frozen=True)
class ContractSpec:
    """Intern kontraktsspec för olika posttyper."""

    kind: str
    label: str
    tone: str
    caution_level: str
    focus_instruction: str
    sections: tuple[SectionSpec, ...]


CONTRACTS: dict[str, ContractSpec] = {
    "dream": ContractSpec(
        kind="dream",
        label="Drömläsning",
        tone="Varm, lugn, essälik — djup och människokunnig utan att göra anspråk på sanning.",
        caution_level="high",
        focus_instruction=(
            "Läs drömmen som ett möjligt uttryck från det undermedvetna. Gå på djupet i *budskap*, *livsbäring* och *varsam vägledning* — kort och användbart. "
            "Symboliska traditioner (symbolic_lenses) är stöd, inte huvudnummer: använd sparsamt (0–2 linser), bara när de bär texten. "
            "Håll allt hypotetiskt; undvik akademisk tyngd och onödig terminologi."
        ),
        sections=(
            SectionSpec(
                "summary",
                "Kort sammanfattning",
                "Max 2–4 meningar, löpande text. Bara kärnan — ingen bildlista.",
            ),
            SectionSpec(
                "dream_movement",
                "Vad drömmen gör",
                "Ett kort stycke (högst två mycket korta stycken med tom rad emellan). "
                "Fånga rörelsen (t.ex. passage, konfrontation, flykt) och de viktigaste bildernas *funktion* med drömmens egna ord där det behövs. "
                "Upprepa inte hela drömmen om sammanfattningen redan gjort jobbet.",
            ),
            SectionSpec(
                "unconscious_message",
                "Möjligt budskap från det undermedvetna",
                "HUVUDDEL: 1–2 stycken (tom rad emellan). En tydlig kärna — hellre en stark tolkningslinje än många spridda hypoteser. "
                "Formulera ödmjukt ('det kan vara som att …', 'en djupare del kan försöka visa …'). Ingen spådom eller predikan.",
            ),
            SectionSpec(
                "symbolic_lenses",
                "Möjliga symboliska läsningar",
                "0–2 linser i normalfallet. Varje lins: kort rubrikrad som slutar med kolon, sedan några meningar — kompakt. "
                "Utelämna helt om sektionen inte tillför mer än du redan sagt i budskap/livsbäring. "
                "Undvik fackspråk och namedropping utan funktion; beskriv vad gestalten *gör* i drömmen. "
                "Om du inte ser starka linser: skriv en enda mening typ «Inga extra symboliska spår känns tydligare än huvudbudskapet här» eller lämna kort motivering — inte utfyllnad.",
            ),
            SectionSpec(
                "life_readings",
                "Möjlig livsbäring",
                "Ett kort stycke: 2–4 kompakta meningar om hur drömmen kan spegla livet nu (känslor, relationer, trygghet, kontroll, sorg, längtan …). "
                "Hypotetiskt: 'drömmen kan spegla …', 'det kan peka mot …'. Aldrig 'detta betyder att du …'.",
            ),
            SectionSpec(
                "gentle_guidance",
                "Varsam vägledning",
                "2–4 meningar, varmt och konkret: vad som kan vara värt att lägga märke till eller möta i vardagen. Inga order — 'det kan vara värt att …', 'en möjlig riktning …'.",
            ),
            SectionSpec(
                "reflection_prompt",
                "Att bära med dig / öppna frågor",
                "Max 1–2 öppna frågor (varje fråga på egen rad). Bara om de verkligen tillför något efter resten av texten. "
                "Knyt till drömmens egna ord eller ögonblick.",
            ),
            SectionSpec(
                "caution",
                "Försiktighet",
                "En mening: möjlig tolkning, inte fakta; inte medicinsk, psykiatrisk eller religiös auktoritet; ersätter inte mänskligt omdöme.",
            ),
        ),
    ),
    "poem": ContractSpec(
        kind="poem",
        label="Diktnärläsning",
        tone="Lyhörd, estetisk och återhållsam.",
        caution_level="medium",
        focus_instruction=(
            "Behandla texten som en dikt: fokusera på bildspråk, rytm, kontraster och möjliga teman "
            "utan att förvandla den till fakta om författaren."
        ),
        sections=(
            SectionSpec("core_reading", "Kort läsning", "2 till 4 meningar om diktens möjliga kärna eller rörelse."),
            SectionSpec("imagery", "Bilder och språk", "2 till 4 korta punkter om bildspråk, ordval eller kontraster."),
            SectionSpec("themes", "Möjliga teman", "2 till 4 korta punkter om teman eller spänningar i texten."),
            SectionSpec("open_question", "Öppen fråga", "1 till 2 korta frågor som öppnar vidare läsning."),
            SectionSpec("caution", "Försiktighet", "1 kort mening om att detta är en möjlig läsning, inte facit."),
        ),
    ),
    "reflection": ContractSpec(
        kind="reflection",
        label="Reflektionsläsning",
        tone="Jordnära, klargörande och varsam.",
        caution_level="medium",
        focus_instruction=(
            "Behandla texten som en reflektion eller vanlig post: håll dig nära det som faktiskt sägs, "
            "lyft möjliga mönster och nästa steg utan att över-symbolisera."
        ),
        sections=(
            SectionSpec("core_reading", "Kärna", "2 till 4 meningar som sammanfattar det viktigaste i texten."),
            SectionSpec("important_signals", "Vad som verkar viktigt", "2 till 4 korta punkter om centrala signaler eller teman."),
            SectionSpec("patterns", "Möjliga mönster", "1 till 3 korta meningar om återkommande drag eller spänningar."),
            SectionSpec("next_reflection", "Nästa fråga", "1 till 3 öppna frågor eller varsamma nästa steg."),
            SectionSpec("caution", "Försiktighet", "1 kort mening om att detta är en möjlig läsning, inte fakta."),
        ),
    ),
}

SYSTEM_BASE_PROMPT = """Du är en lugnt reflekterande svensk assistent för texttolkning.
Du är icke-dömande och försiktig med påståenden.
Du säger aldrig att något "definitivt betyder" något.
Du markerar tydligt osäkerhet.
Du ställer INTE diagnoser. Du ger INTE medicinska eller psykologiska sanningar.
Du ger INTE religiösa eller övernaturliga påståenden som fakta.
Du håller svaren korta, tydliga och användbara.
Du svarar bara på svenska."""


def _get_post_with_concepts(conn, post_id: int) -> dict | None:
    """Hämta post med titel, innehåll och kopplade begrepp."""
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT p.PostID, p.Titel, p.Innehall, k.Namn AS KategoriNamn FROM Poster p "
        "JOIN Kategorier k ON p.KategoriID = k.KategoriID WHERE p.PostID = %s",
        (post_id,),
    )
    post = cur.fetchone()
    if not post:
        return None
    cur.execute(
        "SELECT b.Ord FROM PostBegrepp pb "
        "JOIN Begrepp b ON pb.BegreppID = b.BegreppID WHERE pb.PostID = %s",
        (post_id,),
    )
    concepts = cur.fetchall()
    cur.close()
    post["begrepp"] = [c["Ord"] for c in concepts]
    return post


def _normalize_category_name(name: str | None) -> str:
    if not name:
        return ""
    normalized = unicodedata.normalize("NFKD", name)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_only.strip().lower()


def _resolve_interpret_contract(category_name: str | None) -> ContractSpec:
    normalized = _normalize_category_name(category_name)
    if "drom" in normalized or "dream" in normalized:
        return CONTRACTS["dream"]
    if "dikt" in normalized or "poesi" in normalized or "poem" in normalized:
        return CONTRACTS["poem"]
    return CONTRACTS["reflection"]


def _concept_focus_lines(matched_top: list[dict], *, desc_max_len: int) -> list[str]:
    """Formatterar automatchade begrepp för användarprompten (ingen trunkering av själva drömtexten)."""
    focus_lines: list[str] = []
    for m in matched_top:
        mt = m.get("matched_token", "")
        mt_info = f' (träff: "{mt}")' if mt and mt != m.get("ord") else ""
        desc = m.get("beskrivning", "") or ""
        if len(desc) > desc_max_len:
            desc = desc[: desc_max_len - 3].rstrip() + "..."
        focus_lines.append(f"- {m['ord']}{mt_info}: {desc}")
    return focus_lines


def _build_system_prompt(contract: ContractSpec) -> str:
    caution_label = "Hög försiktighet" if contract.caution_level == "high" else "Mellan försiktighet"
    base = (
        f"{SYSTEM_BASE_PROMPT}\n\n"
        f"Arbetssätt: {contract.label}.\n"
        f"Ton: {contract.tone}\n"
        f"Försiktighetsnivå: {caution_label}.\n"
        f"Fokus: {contract.focus_instruction}"
    )
    if contract.kind == "dream":
        base += "\n\n" + DREAM_SYSTEM_ADDON.strip() + "\n\n" + DREAM_SYMBOLIC_LENS_ADDON.strip()
    return base


def _build_user_prompt(
    post: dict,
    contract: ContractSpec,
    matched_top: list[dict],
    *,
    concept_desc_max_len: int = 200,
) -> str:
    section_schema = "\n".join(
        f'- id="{section.id}" title="{section.title}" -> {section.instruction}'
        for section in contract.sections
    )
    prompt = f"""Svara ENDAST med giltig JSON och inga markdown-rubriker eller fritextrader utanför JSON.

JSON-format:
{{
  "sections": [
    {{"id": "{contract.sections[0].id}", "content": "..." }}
  ]
}}

Krav:
- Returnera exakt {len(contract.sections)} objekt i "sections".
- Använd exakt dessa section-id:n i exakt denna ordning:
{section_schema}
- Varje "content" ska vara på svenska, nära postens ord; hitta inte på scener som inte finns i texten.
- Skriv sammanhängande stycken (radbrytning \\n\\n mellan stycken). Undvik punktlistor med - eller *.
- Våga gå från bild till liv i budskap/livsbäring/vägledning — alltid som möjlighet, aldrig som fakta.
- Håll svaren samlade: undvik upprepning mellan sektioner; symbolic_lenses ska inte duplicera huvudbudskapet.
- Försiktighetsdelen: en kort mening om osäkerhet och gränser.

## Post
Titel: {post['Titel']}
Kategori: {post['KategoriNamn']}

## Innehåll (fulltext, ingen trunkering av postens brödtext)
{post['Innehall']}
"""
    if contract.kind == "dream":
        prompt += (
            "\n## Inmatningskontrakt (transparens)\n"
            "- Ovan under «Innehåll» står hela drömbeskrivningen i oförkortad form.\n"
            "- Titel och kategori är metadata.\n"
            "- Manuellt kopplade begrepp och listan «Begrepp i fokus» är sekundärt stöd från lexikonet (trunkeras bara i beskrivningstext per rad om den är mycket lång).\n"
        )
    if post.get("begrepp"):
        prompt += f"\n## Manuellt kopplade begrepp\n{', '.join(post['begrepp'])}\n"
    if matched_top:
        lines = _concept_focus_lines(matched_top, desc_max_len=concept_desc_max_len)
        prompt += "\n## Begrepp i fokus (automatiskt hittade i texten)\n" + "\n".join(lines)
    if contract.kind == "dream":
        prompt += (
            "\n## Checklista innan du skriver JSON\n"
            "- Är «Möjligt budskap från det undermedvetna» tydligt och bärande utan att bli långt?\n"
            "- Är «Vad drömmen gör» kort och fokuserat på rörelse och bildfunktion — utan att upprepa hela drömmen?\n"
            "- Har symbolic_lenses högst 0–2 linser (eller kort motiverat utelämnande) utan dogmatiska påståenden?\n"
            "- Är livsbäring och varsam vägledning korta och livsnära?\n"
            "- Har reflection_prompt max 1–2 frågor som verkligen behövs?\n"
            "- Är försiktighet en enda kort mening?\n"
            "- Varje djupare påstående förankrat i drömmens scener; inga tomma abstraktioner.\n"
        )
    return prompt


def _dream_fallback_sections(post: dict, contract: ContractSpec) -> list[InterpretationSection]:
    """När modellen misslyckas: livsnära reservtext utifrån att drömmen kan bära ett undermedvetet budskap."""
    inn = (post.get("Innehall") or "").strip()
    snippet = (inn[:420] + "…") if len(inn) > 420 else inn
    words = sorted(
        {m.group(0).lower() for m in re.finditer(r"\b[\wåäö]{5,}\b", inn, flags=re.IGNORECASE)},
        key=len,
        reverse=True,
    )[:10]
    w0 = words[0] if words else "drömmen"
    w1 = words[1] if len(words) > 1 else w0
    w2 = words[2] if len(words) > 2 else w1
    summary = (
        f"Utifrån det du berättat tycks drömmen röra sig genom en tydlig följd av skeenden snarare än enstaka lösa bilder. "
        f"Texten lyfter bland annat «{w0}» och «{w1}». Det här reservsvaret kan inte ersätta en full tolkning, men pekar på att det finns en berättande kedja att lyssna till."
    )
    movement = (
        f"I den ordning du beskriver kan man läsa drömmen som en rörelse genom olika lägen — där «{w0}», «{w1}» och «{w2}» "
        f"inte bara 'finns till' utan för skiftningar i rum, riktning eller uppmärksamhet. "
        f"En möjlig fråga är vad varje moment *gör* för drömmaren i just den här kedjan.\n\n"
        f"Kort återhämtat från din text: «{snippet}»"
    )
    unconscious = (
        "Om drömmen förstås som ett möjligt uttryck från det undermedvetna kan den handla om att något i dig söker uppmärksamhet — "
        f"kanske kring spänningen mellan «{w0}» och «{w1}». "
        "Det kan vara som att en djupare del försöker gestalta något du ännu inte helt satt ord på — inte som bevis, utan som inbjudan att lyssna."
    )
    symbolic = (
        f"Klassisk drömtydning (hypotetisk):\n"
        f"Utgå från vad «{w0}» och «{w1}» *gör* i scenen — handling före fria associationer.\n\n"
        f"Jungianskt (hypotetiskt):\n"
        f"Motiv kring «{w2}» kan fungera som en gestalt i en inre dramatik — inte som en fastställd roll i ditt liv."
    )
    life = (
        f"En möjlig livsläsning är att drömmen kan spegla hur du förhåller dig till trygghet, kontroll eller överlämnande i något som pågår i livet — "
        f"knutet till det drömmen visar kring «{w0}». "
        f"En annan möjlighet är att den berör längtan, sorg eller rädsla som ännu inte fått full plats i medvetandet. "
        "Det är hypoteser, inte sanningar om dig."
    )
    guidance = (
        "Det kan vara värt att lägga märke till var i drömmen du känner mest värme, spänning eller lättnad — och om det finns en parallell i vardagen. "
        "Du kan också fråga dig vad du håller på att lämna, möta eller växa in i, utan att behöva svara direkt."
    )
    qs = [
        f"Vad händer i dig när du återbesöker ögonblicket med «{w0}» i drömmen?",
        f"Hur skulle läsningen skifta om «{w1}» stod för en del av dig själv — vad skulle den delen vilja säga?",
    ]
    q_block = "\n".join(qs)
    caution = (
        "Detta är ett reservunderlag när AI-strukturen bröts — inte en bedömning, diagnos eller sanning om dig. "
        "Läs det som öppna dörrar; det som inte känns träffsäkert får du lägga åt sidan."
    )
    by_id = {
        "summary": summary,
        "dream_movement": movement,
        "unconscious_message": unconscious,
        "symbolic_lenses": symbolic,
        "life_readings": life,
        "gentle_guidance": guidance,
        "reflection_prompt": q_block,
        "caution": caution,
    }
    out: list[InterpretationSection] = []
    for section in contract.sections:
        out.append(
            InterpretationSection(
                id=section.id,
                title=section.title,
                content=by_id.get(
                    section.id,
                    "Här saknades material — återvänd till din drömbeskrivning som källa.",
                ),
            )
        )
    return out


def _extract_json_payload(raw_text: str) -> dict:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in AI response.")
    return json.loads(raw_text[start : end + 1])


def _structure_ai_response(
    raw_text: str,
    contract: ContractSpec,
    *,
    post: dict | None = None,
) -> list[InterpretationSection]:
    try:
        payload = _extract_json_payload(raw_text)
        raw_sections = payload.get("sections")
        if not isinstance(raw_sections, list):
            raise ValueError("JSON missing sections list.")

        by_id: dict[str, str] = {}
        for item in raw_sections:
            if not isinstance(item, dict):
                continue
            section_id = item.get("id")
            content = item.get("content")
            if isinstance(section_id, str) and isinstance(content, str) and section_id not in by_id:
                cleaned = content.strip()
                if cleaned:
                    by_id[section_id] = cleaned

        structured: list[InterpretationSection] = []
        for section in contract.sections:
            content = by_id.get(section.id)
            if not content:
                raise ValueError(f"Missing section {section.id}.")
            structured.append(
                InterpretationSection(id=section.id, title=section.title, content=content)
            )
        return structured
    except Exception:
        paragraphs = [chunk.strip() for chunk in raw_text.split("\n\n") if chunk.strip()]
        fallback_sections: list[InterpretationSection] = []
        for index, section in enumerate(contract.sections):
            if index < len(paragraphs):
                content = paragraphs[index]
            elif section.id == "caution":
                content = (
                    "Detta är en möjlig tolkning — inte fakta om dig eller din situation. "
                    "Låt det som känns relevant få landa mjukt, och släpp resten."
                )
            else:
                content = (
                    "Här fanns inte tillräckligt tydlig struktur i svaret för den här delen. "
                    "Du kan ändå använda helheten som ett öppet underlag, inte som ett facit."
                )
            fallback_sections.append(
                InterpretationSection(id=section.id, title=section.title, content=content)
            )
        if contract.kind == "dream" and post:
            return _dream_fallback_sections(post, contract)
        return fallback_sections


def _render_interpretation_text(sections: list[InterpretationSection]) -> str:
    return "\n\n".join(f"{section.title}\n{section.content}" for section in sections)


def _contract_summary(contract: ContractSpec) -> InterpretationContract:
    return InterpretationContract(
        kind=contract.kind,
        label=contract.label,
        tone=contract.tone,
        caution_level=contract.caution_level,
        section_titles=[section.title for section in contract.sections],
    )


@router.post("/posts/{post_id}/interpret", response_model=InterpretResponse)
def interpret_post(
    post_id: int,
    model: str | None = Query(None, description="Valfri modell för AI-tolkning."),
    user_id: int = Depends(get_current_user_id),
):
    """
    Generera en kort AI-tolkning av en post.
    Kräver inloggning. Privata poster: endast ägare. Publika: inloggad användare.
    Kräver OPENAI_API_KEY. Modell kan väljas via query-param.
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI-tolkning är inte konfigurerad. OPENAI_API_KEY saknas.",
        )

    api_post = post_repo.get_post_by_id(post_id)
    if not api_post:
        raise HTTPException(status_code=404, detail="Posten hittades inte.")
    owner_id = api_post["anvandar"]["anvandar_id"]
    if api_post["synlighet"] != "publik" and owner_id != user_id:
        raise HTTPException(status_code=403, detail="Du kan bara tolka egna privata poster")

    conn = get_connection()
    post = _get_post_with_concepts(conn, post_id)
    conn.close()
    if not post:
        raise HTTPException(status_code=404, detail="Posten hittades inte.")

    contract = _resolve_interpret_contract(post.get("KategoriNamn"))
    try:
        chosen_model, _explicit = resolve_requested_model_id(model)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None

    # Automatchade begrepp (inkl. phrase-level) för bättre AI-underlag
    text_for_match = f"{post.get('Titel', '')} {post.get('Innehall', '')}"
    try:
        all_concepts = concept_repo.get_all_concepts()
        matched = find_matches(text_for_match, all_concepts, include_phrases=True)
    except Exception:
        matched = []
    matched_top = matched[:28]  # Fler träffar som sekundärt lexikonstöd (dröm: rikare symbolkontext)
    concept_desc_max = 520 if contract.kind == "dream" else 220
    system_prompt = _build_system_prompt(contract)
    user_content = _build_user_prompt(
        post, contract, matched_top, concept_desc_max_len=concept_desc_max
    )

    try:
        import httpx
        from openai import OpenAI

        # Skicka explicit http_client för att undvika proxies-kompatibilitetsproblem
        # mellan openai och vissa httpx-versioner (t.ex. vid proxy-miljöer)
        http_client = httpx.Client(timeout=60.0, follow_redirects=True, trust_env=False)
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY, http_client=http_client)
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ]
            response = create_interpret_chat_completion(
                client, model=chosen_model, messages=messages
            )
            raw_text = (response.choices[0].message.content or "").strip()
            if not raw_text:
                text = "AI:n returnerade inget svar. Försök igen."
                sections = _structure_ai_response(text, contract, post=post)
            else:
                sections = _structure_ai_response(raw_text, contract, post=post)
            sections = postprocess_interpretation_sections(
                sections,
                source_text=post.get("Innehall") or "",
                kind=contract.kind,
            )
            highlight: list[str] = []
            seen: set[str] = set()
            for m in matched_top:
                o = (m.get("ord") or "").strip()
                if o and o.lower() not in seen:
                    seen.add(o.lower())
                    highlight.append(o)
            return {
                "interpretation": _render_interpretation_text(sections),
                "model_used": chosen_model,
                "disclaimer": DISCLAIMER_TEXT,
                "contract": _contract_summary(contract),
                "sections": sections,
                "matched_highlight": highlight[:16],
            }
        finally:
            http_client.close()
    except Exception as e:
        err_msg = str(e)
        logger.exception("AI-tolkning misslyckades: %s", err_msg)
        el = err_msg.lower()
        if "rate" in el or "quota" in el:
            raise HTTPException(503, "API-gräns nådd. Försök senare.")
        if (
            ("invalid" in el and "model" in el)
            or "model_not_found" in el
            or "does not exist" in el
            or "unsupported model" in el
        ):
            opts = [m.id for m in allowed_model_objects() if m.id != chosen_model]
            fallback = opts[0] if opts else default_model_id()
            raise HTTPException(
                400,
                f"Modellen {chosen_model} är inte tillgänglig för detta API-konto. Prova {fallback}.",
            )
        raise HTTPException(502, f"AI-tjänsten svarade inte: {err_msg[:200]}")


@router.get("/interpret/status", response_model=InterpretStatus)
def interpret_status():
    """Kontrollera om AI-tolkning är tillgänglig (utan att exponera nyckel)."""
    return {
        "available": bool(settings.OPENAI_API_KEY),
        "model_default": default_model_id(),
        "model_options": [model.model_dump() for model in allowed_model_objects()],
    }
