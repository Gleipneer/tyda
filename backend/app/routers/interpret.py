"""
AI-tolkning av poster – server-side, advisory lager.
API-nyckel i miljövariabel, aldrig exponerad till klienten.
Använder automatchade begrepp och phrase-signaler för bättre underlag.
"""
import json
import logging
import unicodedata
from dataclasses import dataclass

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.db import get_connection
from app.repositories import concept_repo
from app.schemas.interpret import (
    InterpretResponse,
    InterpretStatus,
    InterpretationContract,
    InterpretationSection,
    SupportedModel,
)
from app.services.symbol_matcher import find_matches

logger = logging.getLogger(__name__)
router = APIRouter()

DISCLAIMER_TEXT = "Detta är en AI-tolkning. En möjlig läsning, inte en definitiv sanning."


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


SUPPORTED_MODELS: tuple[SupportedModel, ...] = (
    SupportedModel(
        id="gpt-4.1-mini",
        label="GPT-4.1 mini",
        description="Mindre och snabbare GPT-4.1. Bra golvmodell för kort, tydlig texttolkning.",
    ),
    SupportedModel(
        id="gpt-4.1",
        label="GPT-4.1",
        description="Smartare 4.1-modell för bredare och mer exakt tolkning utan tydligt resonemangssteg.",
    ),
    SupportedModel(
        id="gpt-4o",
        label="GPT-4o",
        description="Stark allroundmodell för de flesta tolkningar när du vill ha mer tyngd än mini-läget.",
    ),
    SupportedModel(
        id="gpt-5-mini",
        label="GPT-5 mini",
        description="Snabbare GPT-5-variant för välstyrda tolkningar med bättre resonemang än 4.1 mini.",
    ),
    SupportedModel(
        id="gpt-5",
        label="GPT-5",
        description="Starkaste alternativet här för mer krävande resonemang och svårare tolkningar.",
    ),
)
SUPPORTED_MODEL_IDS = {model.id for model in SUPPORTED_MODELS}
DEFAULT_MODEL_ID = SUPPORTED_MODELS[0].id

CONTRACTS: dict[str, ContractSpec] = {
    "dream": ContractSpec(
        kind="dream",
        label="Drömläsning",
        tone="Symbolisk, varsam och tydligt osäker.",
        caution_level="high",
        focus_instruction=(
            "Behandla texten som en dröm: lyft symboler, rörelser, stämningar och återkommande motiv "
            "utan att låsa fast dem i en enda betydelse."
        ),
        sections=(
            SectionSpec("core_reading", "Kort drömläsning", "2 till 4 meningar om möjlig kärna i drömmen."),
            SectionSpec("symbols", "Symboler och motiv", "2 till 4 korta punkter om de mest bärande symbolerna."),
            SectionSpec("emotional_current", "Känsloström", "1 till 3 korta meningar om möjlig känsloton eller rörelse."),
            SectionSpec("reflection_prompt", "Att bära med sig", "1 till 3 öppna frågor eller reflektioner."),
            SectionSpec("caution", "Försiktighet", "1 kort mening som markerar osäkerhet och undviker diagnoser."),
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
        "SELECT b.Ord, pb.RelationTyp FROM PostBegrepp pb "
        "JOIN Begrepp b ON pb.BegreppID = b.BegreppID WHERE pb.PostID = %s",
        (post_id,),
    )
    concepts = cur.fetchall()
    cur.close()
    post["begrepp"] = [f"{c['Ord']} ({c['RelationTyp']})" for c in concepts]
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


def _normalize_model(model: str | None) -> str:
    chosen = (model or settings.OPENAI_MODEL or DEFAULT_MODEL_ID).strip()
    if chosen in SUPPORTED_MODEL_IDS:
        return chosen
    fallback = settings.OPENAI_MODEL.strip() if settings.OPENAI_MODEL.strip() in SUPPORTED_MODEL_IDS else DEFAULT_MODEL_ID
    return fallback


def _build_system_prompt(contract: ContractSpec) -> str:
    caution_label = "Hög försiktighet" if contract.caution_level == "high" else "Mellan försiktighet"
    return (
        f"{SYSTEM_BASE_PROMPT}\n\n"
        f"Arbetssätt: {contract.label}.\n"
        f"Ton: {contract.tone}\n"
        f"Försiktighetsnivå: {caution_label}.\n"
        f"Fokus: {contract.focus_instruction}"
    )


def _build_user_prompt(post: dict, contract: ContractSpec, matched_top: list[dict]) -> str:
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
- Varje "content" ska vara kort, konkret och på svenska.
- Bygg på postens ord, motiv och begrepp. Hitta inte på dolda fakta.
- Försiktighetsdelen ska tydligt markera osäkerhet.

## Post
Titel: {post['Titel']}
Kategori: {post['KategoriNamn']}

## Innehåll
{post['Innehall']}
"""
    if post.get("begrepp"):
        prompt += f"\n## Manuellt kopplade begrepp\n{', '.join(post['begrepp'])}\n"
    if matched_top:
        focus_lines = []
        for m in matched_top:
            mt = m.get("matched_token", "")
            mt_info = f' (träff: "{mt}")' if mt and mt != m["ord"] else ""
            desc = m.get("beskrivning", "") or ""
            desc_short = desc[:150] + "..." if len(desc) > 150 else desc
            focus_lines.append(f"- {m['ord']}{mt_info}: {desc_short}")
        prompt += "\n## Begrepp i fokus (automatiskt hittade i texten)\n" + "\n".join(focus_lines)
    return prompt


def _extract_json_payload(raw_text: str) -> dict:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in AI response.")
    return json.loads(raw_text[start : end + 1])


def _structure_ai_response(raw_text: str, contract: ContractSpec) -> list[InterpretationSection]:
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
                content = "Detta är en möjlig läsning och bör hållas öppet, inte tas som fakta."
            else:
                content = "Modellen svarade inte helt enligt kontraktet den här gången."
            fallback_sections.append(
                InterpretationSection(id=section.id, title=section.title, content=content)
            )
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
):
    """
    Generera en kort AI-tolkning av en post.
    Kräver OPENAI_API_KEY. Modell kan väljas via query-param.
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI-tolkning är inte konfigurerad. OPENAI_API_KEY saknas.",
        )

    conn = get_connection()
    post = _get_post_with_concepts(conn, post_id)
    conn.close()
    if not post:
        raise HTTPException(status_code=404, detail="Posten hittades inte.")

    contract = _resolve_interpret_contract(post.get("KategoriNamn"))
    chosen_model = _normalize_model(model)

    # Automatchade begrepp (inkl. phrase-level) för bättre AI-underlag
    text_for_match = f"{post.get('Titel', '')} {post.get('Innehall', '')}"
    try:
        all_concepts = concept_repo.get_all_concepts()
        matched = find_matches(text_for_match, all_concepts, include_phrases=True)
    except Exception:
        matched = []
    matched_top = matched[:15]  # Begränsa för att hålla prompten hanterbar
    system_prompt = _build_system_prompt(contract)
    user_content = _build_user_prompt(post, contract, matched_top)

    try:
        import httpx
        from openai import OpenAI

        # Skicka explicit http_client för att undvika proxies-kompatibilitetsproblem
        # mellan openai och vissa httpx-versioner (t.ex. vid proxy-miljöer)
        http_client = httpx.Client(timeout=60.0, follow_redirects=True, trust_env=False)
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY, http_client=http_client)
            response = client.chat.completions.create(
                model=chosen_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=700,
                temperature=0.2,
            )
            raw_text = (response.choices[0].message.content or "").strip()
            if not raw_text:
                text = "AI:n returnerade inget svar. Försök igen."
                sections = _structure_ai_response(text, contract)
            else:
                sections = _structure_ai_response(raw_text, contract)
            return {
                "interpretation": _render_interpretation_text(sections),
                "model_used": chosen_model,
                "disclaimer": DISCLAIMER_TEXT,
                "contract": _contract_summary(contract),
                "sections": sections,
            }
        finally:
            http_client.close()
    except Exception as e:
        err_msg = str(e)
        logger.exception("AI-tolkning misslyckades: %s", err_msg)
        if "rate" in err_msg.lower() or "quota" in err_msg.lower():
            raise HTTPException(503, "API-gräns nådd. Försök senare.")
        if "invalid" in err_msg.lower() and "model" in err_msg.lower():
            fallback = next((model.id for model in SUPPORTED_MODELS if model.id != chosen_model), DEFAULT_MODEL_ID)
            raise HTTPException(
                400,
                f"Modellen {chosen_model} är inte tillgänglig. Prova {fallback}.",
            )
        raise HTTPException(502, f"AI-tjänsten svarade inte: {err_msg[:200]}")


@router.get("/interpret/status", response_model=InterpretStatus)
def interpret_status():
    """Kontrollera om AI-tolkning är tillgänglig (utan att exponera nyckel)."""
    return {
        "available": bool(settings.OPENAI_API_KEY),
        "model_default": _normalize_model(settings.OPENAI_MODEL),
        "model_options": [model.model_dump() for model in SUPPORTED_MODELS],
    }
