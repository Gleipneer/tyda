"""
AI-tolkning av poster – server-side, advisory lager.
API-nyckel i miljövariabel, aldrig exponerad till klienten.
"""
from __future__ import annotations

import json
import logging
import time
import unicodedata
from dataclasses import dataclass

from fastapi import APIRouter, Body, Depends, HTTPException, Query

from app.config import settings
from app.deps import CurrentUser, get_current_user_optional
from app.db import get_connection
from app.repositories import concept_repo
from app.schemas.interpret import (
    InterpretRequestBody,
    InterpretResponse,
    InterpretStatus,
    InterpretationContract,
    InterpretationSection,
    SupportedModel,
)
from app.services.symbol_matcher import find_matches

logger = logging.getLogger(__name__)
router = APIRouter()

DISCLAIMER_TEXT = (
    "Detta är en AI-tolkning: en möjlig läsning att utforska, inte en objektiv sanning om dig eller din situation."
)

_RUNTIME_CACHE_TTL_OK = 300.0
_RUNTIME_CACHE_TTL_FAIL = 60.0
_runtime_cache: dict[str, float | frozenset[str] | bool | None] = {
    "ts": 0.0,
    "ids": None,
    "ok": False,
}


@dataclass(frozen=True)
class SectionSpec:
    """Intern kontraktsspec för varje del i svaret."""

    id: str
    title: str
    instruction: str


@dataclass(frozen=True)
class ContractSpec:
    """Intern kontraktsspec för olika tolkningstyper."""

    kind: str
    label: str
    tone: str
    caution_level: str
    focus_instruction: str
    sections: tuple[SectionSpec, ...]


def _base_sections(kind_note: str) -> tuple[SectionSpec, ...]:
    """Enhetlig sexdelad struktur: konkret → djupare → öppen fråga → varsamhet."""
    return (
        SectionSpec(
            "overview",
            "Kort läsning",
            f"Skriv 2–5 meningar sammanhängande prosa på svenska. {kind_note} "
            "Börja nära texten, undvik punktlistor, undvik JSON-känsla.",
        ),
        SectionSpec(
            "carrying_elements",
            "Bärande bilder eller element",
            "2–4 korta meningar (prosa eller mycket korta satser) om vad som framträder starkast — bilder, scener, ord eller skeenden.",
        ),
        SectionSpec(
            "inner_movement",
            "Möjlig känslomässig eller symbolisk rörelse",
            "2–4 meningar om möjliga känslor, spänningar, önskemål, rädslor eller inre rörelse. "
            "Använd formuleringar som «kan spegla», «kan peka mot», «möjlig läsning» — aldrig «detta betyder» eller «det visar att».",
        ),
        SectionSpec(
            "themes",
            "Möjliga teman",
            "2–4 korta meningar om teman eller mönster (relationer, makt, tillit, skam, sorg, längtan, förändring) utan att övertydliggöra.",
        ),
        SectionSpec(
            "open_question",
            "Öppen fråga",
            "En enda konkret, användbar fråga som följer logiskt av texten — inte en generisk meningslös fråga.",
        ),
        SectionSpec(
            "caution",
            "Försiktighet",
            "En kort mening: detta är ett reflektionsstöd, en möjlig tolkning, inte facit eller diagnos.",
        ),
    )


CONTRACTS: dict[str, ContractSpec] = {
    "dream": ContractSpec(
        kind="dream",
        label="Drömtolkning",
        tone="Symbolisk, varsam, nära drömmens bildvärld.",
        caution_level="high",
        focus_instruction=(
            "Utgå från att materialet är en dröm: symbolik, känsloliv, inre konflikter, relation mellan delar, "
            "miljö och transformation. Var tydlig med att flera läsningar är möjliga."
        ),
        sections=_base_sections("Läs drömmen som inre scen, inte som rapport om verkligheten."),
    ),
    "poem": ContractSpec(
        kind="poem",
        label="Dikttolkning",
        tone="Lyhörd, estetisk, nära språket.",
        caution_level="medium",
        focus_instruction=(
            "Utgå från att materialet är en dikt: bildspråk, ton, motiv, spänningar och möjlig symbolik — "
            "inte biografi som fakta."
        ),
        sections=_base_sections("Låt språket och bilderna leda, utan att låsa betydelsen."),
    ),
    "reflection": ContractSpec(
        kind="reflection",
        label="Reflektion eller tanke",
        tone="Jordnära, tydlig, respektfull.",
        caution_level="medium",
        focus_instruction=(
            "Utgå från reflektion eller vardaglig text: det uttryckta, möjliga behov, gränser, mening och rörelse — "
            "utan att överdriva symbolik."
        ),
        sections=_base_sections("Håll dig nära vad som faktiskt sägs, med öppenhet för underliggande känslor."),
    ),
    "text_excerpt": ContractSpec(
        kind="text_excerpt",
        label="Text eller utdrag",
        tone="Tydlig och nära materialet.",
        caution_level="medium",
        focus_instruction=(
            "Utgå från ett utdrag eller blandad text: vad som händer i språket, vad som betonas, vad som utelämnas."
        ),
        sections=_base_sections("Behandla det som text, inte automatiskt som dikt eller dröm."),
    ),
    "symbol_focus": ContractSpec(
        kind="symbol_focus",
        label="Symbolfokus",
        tone="Utforskande, mångtydigt tillåtet.",
        caution_level="high",
        focus_instruction=(
            "Användaren vill lyfta symboliska skikt: möjliga betydelsefält, känsla, funktion, dubbelhet, personlig resonans — "
            "med stor ödmjukhet."
        ),
        sections=_base_sections("Undvik att göra symboler till en enda förklaring."),
    ),
    "event_experience": ContractSpec(
        kind="event_experience",
        label="Händelse eller upplevelse",
        tone="Nära upplevelsen, varsamt psykologiskt språk.",
        caution_level="medium",
        focus_instruction=(
            "Utgå från en händelse eller upplevelse: känslomässig kärna, konflikt, försvar, behov, mening och rörelse — "
            "inte moralbedömning."
        ),
        sections=_base_sections("Låt det som hände få plats samtidigt som du frågar vad det kan röra vid inuti."),
    ),
    "relation_situation": ContractSpec(
        kind="relation_situation",
        label="Relation eller situation",
        tone="Relationsnära, varsamt.",
        caution_level="medium",
        focus_instruction=(
            "Utgå från relationer eller sociala situationer: gränser, längtan, maktförhållanden, tillit, sårbarhet — "
            "som möjliga läsningar."
        ),
        sections=_base_sections("Undvik att säga vad andra människor «egentligen» menar."),
    ),
    "free": ContractSpec(
        kind="free",
        label="Fri tolkning",
        tone="Öppen, inre-livsgrundad, utan att bli flummig.",
        caution_level="medium",
        focus_instruction=(
            "Fri tolkning med tyngdpunkt på människans inre liv: känslor, konflikter, längtan, relationer, "
            "splittring och möjlig integration — alltid som möjliga perspektiv."
        ),
        sections=_base_sections("Ge en sammanhängande gång från konkret till djupare, utan skolmall."),
    ),
}

SUPPORTED_MODELS: tuple[SupportedModel, ...] = (
    SupportedModel(
        id="gpt-4.1-mini",
        label="GPT-4.1 mini",
        description="Mindre och snabbare GPT-4.1. Bra golvmodell för kort, tydlig texttolkning.",
    ),
    SupportedModel(
        id="gpt-4.1",
        label="GPT-4.1",
        description="Smartare 4.1-modell för bredare och mer exakt tolkning.",
    ),
    SupportedModel(
        id="gpt-4o",
        label="GPT-4o",
        description="Stark allroundmodell när du vill ha mer tyngd än mini-läget.",
    ),
    SupportedModel(
        id="gpt-5-mini",
        label="GPT-5 mini",
        description="Snabbare GPT-5-variant för välstyrda tolkningar.",
    ),
    SupportedModel(
        id="gpt-5",
        label="GPT-5",
        description="Starkaste alternativet här för mer krävande resonemang.",
    ),
)
SUPPORTED_MODEL_IDS = {m.id for m in SUPPORTED_MODELS}
DEFAULT_MODEL_ID = SUPPORTED_MODELS[0].id

_SECTION_FALLBACK_TEXT: dict[str, str] = {
    "overview": (
        "Här blev inte hela sammanfattningen med i modellens svar. "
        "Läs gärna din text en gång till och låt de andra avsnitten, om de finns, ge stöd."
    ),
    "carrying_elements": (
        "Vilka delar som bär mest laddning beskrevs inte tydligt här. "
        "Du kan själv notera ord, bilder eller scener som sticker ut eller återkommer."
    ),
    "inner_movement": (
        "En tydlig skildring av känslomässig rörelse fanns inte med i svaret. "
        "Stanna vid om stämningen skiftar någonstans i texten — det kan vara ett spår att följa."
    ),
    "themes": (
        "Tematiska trådar lyftes inte uttryckligen; de kan finnas som undertoner i det du skrivit ändå."
    ),
    "open_question": "Vilken del av texten vill du utforska lite längre, och vad väcker den hos dig just nu?",
    "caution": "Detta är ett stöd för reflektion — en möjlig läsning, inte en sanning om dig eller din situation.",
}

SYSTEM_BASE_PROMPT = """Du är en lugnt reflekterande svensk assistent för texttolkning.
Din grund är människans inre liv: känslor, relationer, konflikter, försvar, längtan, skam, sorg, rädsla, hopp,
splittring, integration och rörelse mellan tillstånd — alltid som möjliga perspektiv, aldrig som fastslagen sanning.
Du är icke-dömande. Du använder formuleringar som «möjlig läsning», «kan spegla», «kan peka mot», «kan symbolisera».
Du säger inte «detta betyder», «det visar att» eller «du är» som fakta.
Du ställer INTE diagnoser och ger INTE medicinska eller psykologiska sanningar.
Du ger INTE religiösa eller övernaturliga påståenden som fakta.
Du svarar bara på svenska.
Svara ENDAST med giltigt JSON enligt användarens schema — inga markdown-kodblock, ingen text före eller efter JSON."""


def _get_post_with_concepts(conn, post_id: int) -> dict | None:
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT p.PostID, p.Titel, p.Innehall, p.Synlighet, p.AnvandarID, k.Namn AS KategoriNamn "
        "FROM Poster p JOIN Kategorier k ON p.KategoriID = k.KategoriID WHERE p.PostID = %s",
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


def _default_interpret_kind(category_name: str | None) -> str:
    n = _normalize_category_name(category_name)
    if "drom" in n or "dream" in n:
        return "dream"
    if "dikt" in n or "poesi" in n or "poem" in n:
        return "poem"
    if "vision" in n:
        return "event_experience"
    if "tanke" in n or "reflektion" in n or "reflection" in n:
        return "reflection"
    return "free"


def _resolve_interpret_contract(selected_kind: str | None, category_name: str | None) -> tuple[ContractSpec, str]:
    if selected_kind and selected_kind in CONTRACTS:
        spec = CONTRACTS[selected_kind]
        return spec, spec.kind
    k = _default_interpret_kind(category_name)
    spec = CONTRACTS[k]
    return spec, k


def _resolve_model_choice(explicit: str | None) -> tuple[str, str | None]:
    """
    Returnerar (modell-id till OpenAI, begärd modell för metadata).
    Ingen tyst ersättning av ogiltigt namn — det hanteras av anroparen med HTTP 400.
    """
    if explicit is None or not str(explicit).strip():
        cfg = (settings.OPENAI_MODEL or "").strip()
        mid = cfg if cfg in SUPPORTED_MODEL_IDS else DEFAULT_MODEL_ID
        return mid, None
    m = explicit.strip()
    if m not in SUPPORTED_MODEL_IDS:
        raise ValueError(m)
    return m, m


def _model_id_runtime_available(model_id: str, openai_ids: frozenset[str]) -> bool:
    if model_id in openai_ids:
        return True
    prefix = model_id + "-"
    return any(oid.startswith(prefix) for oid in openai_ids)


def _fetch_openai_model_ids() -> tuple[frozenset[str] | None, bool]:
    """Hämta modell-id från OpenAI (cachad). Returnerar (ids, lyckades)."""
    global _runtime_cache
    now = time.monotonic()
    ts = float(_runtime_cache["ts"])
    ttl = _RUNTIME_CACHE_TTL_OK if _runtime_cache["ok"] else _RUNTIME_CACHE_TTL_FAIL
    if _runtime_cache["ids"] is not None and now - ts < ttl:
        return _runtime_cache["ids"], bool(_runtime_cache["ok"])

    if not settings.OPENAI_API_KEY:
        _runtime_cache = {"ts": now, "ids": None, "ok": False}
        return None, False

    try:
        import httpx
        from openai import OpenAI

        http_client = httpx.Client(timeout=20.0, follow_redirects=True, trust_env=False)
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY, http_client=http_client)
            lst = client.models.list()
            ids = frozenset(m.id for m in lst.data if getattr(m, "id", None))
            _runtime_cache = {"ts": now, "ids": ids, "ok": True}
            return ids, True
        finally:
            http_client.close()
    except Exception as e:
        logger.warning("Kunde inte lista OpenAI-modeller: %s", e)
        _runtime_cache = {"ts": now, "ids": None, "ok": False}
        return None, False


def _options_for_status() -> tuple[list[SupportedModel], bool, str | None]:
    """
    Bygg modellista för UI.
    Om runtime-verifiering lyckas: bara modeller som matchar listan (prefix/exakt).
    Om inga träffar trots lyckad lista: anses listan inkonklusiv — visa alla med förklaring.
    """
    ids, ok = _fetch_openai_model_ids()
    if not ok or not ids:
        msg = (
            "Kunde inte verifiera modeller mot OpenAI just nu. "
            "Listan visar konfigurerade modeller; anrop kan ändå misslyckas om ditt konto saknar åtkomst."
        )
        return [SupportedModel.model_validate(m.model_dump()) for m in SUPPORTED_MODELS], False, msg

    filtered: list[SupportedModel] = []
    for m in SUPPORTED_MODELS:
        if _model_id_runtime_available(m.id, ids):
            filtered.append(SupportedModel.model_validate({**m.model_dump(), "runtime_available": True}))

    if not filtered:
        msg = (
            "OpenAI-listan matchade inga förkonfigurerade modell-id (oväntat). "
            "Alla konfigurerade modeller visas; testa ett anrop eller kontrollera konto/API."
        )
        return [SupportedModel.model_validate(m.model_dump()) for m in SUPPORTED_MODELS], False, msg

    return filtered, True, None


def _build_system_prompt(contract: ContractSpec) -> str:
    caution_label = "Hög försiktighet" if contract.caution_level == "high" else "Mellan försiktighet"
    return (
        f"{SYSTEM_BASE_PROMPT}\n\n"
        f"Tolkningstyp: {contract.label}.\n"
        f"Ton: {contract.tone}\n"
        f"Försiktighetsnivå: {caution_label}.\n"
        f"Fokus: {contract.focus_instruction}\n\n"
        "Internt arbetssätt (för din ordning i texten):\n"
        "1) Vad händer konkret i materialet?\n"
        "2) Vilka bilder eller element bär mest laddning?\n"
        "3) Vilka känslor eller spänningar kan finnas under ytan?\n"
        "4) Vilken inre konflikt eller rörelse kan detta spegla?\n"
        "5) Finns förändring, upplösning eller förskjutning?\n"
        "6) Vilken öppen, respektfull fråga vill du lämna med läsaren?\n"
    )


def _build_user_prompt(
    post: dict,
    contract: ContractSpec,
    matched_top: list[dict],
    interpret_kind_effective: str,
    interpret_kind_user: str | None,
) -> str:
    section_schema = "\n".join(
        f'- id="{section.id}" title="{section.title}" -> {section.instruction}'
        for section in contract.sections
    )
    user_choice = interpret_kind_user or "(ingen explicit — standard från kategori)"
    prompt = f"""Svara ENDAST med giltig JSON.

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
- Varje "content" ska vara sammanhängande prosa (eller korta meningar), lugnt språk, utan upprepande fraser som «enligt kontraktet».
- Bygg på postens ord och begrepp. Hitta inte på dolda fakta.
- Rubrikerna i JSON används bara som id; skriv innehållet som om det ska läsas av en människa.

## Tolkningstyp
Vald av användaren (eller standard): {user_choice}
Effektiv tolkningsprofil: {interpret_kind_effective} — {contract.label}

## Post
Titel: {post['Titel']}
Postkategori (arkiv): {post['KategoriNamn']}

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


def _derive_open_question(overview: str) -> str:
    s = overview.strip()
    if len(s) < 16:
        return _SECTION_FALLBACK_TEXT["open_question"]
    return (
        "Utifrån det som beskrivs ovan: vad känns mest angeläget att utforska vidare — "
        "utan att kräva ett bestämt svar av dig själv?"
    )


def _structure_ai_response(raw_text: str, contract: ContractSpec) -> tuple[list[InterpretationSection], bool]:
    """Normalisera modelloutput; returnerar (sektioner, contract_degraded)."""
    degraded = False
    by_id: dict[str, str] = {}

    try:
        payload = _extract_json_payload(raw_text)
        raw_sections = payload.get("sections")
        if not isinstance(raw_sections, list):
            raise ValueError("JSON missing sections list.")

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
        missing_count = 0
        for section in contract.sections:
            content = by_id.get(section.id, "").strip()
            if not content:
                missing_count += 1
                if section.id == "open_question":
                    content = _derive_open_question(by_id.get("overview", ""))
                else:
                    content = _SECTION_FALLBACK_TEXT.get(
                        section.id,
                        "Här saknades innehåll i modellens svar; fortsätt gärna utifrån din egen läsning.",
                    )
            structured.append(InterpretationSection(id=section.id, title=section.title, content=content))

        if missing_count:
            degraded = True
        return structured, degraded
    except Exception:
        degraded = True
        paragraphs = [chunk.strip() for chunk in raw_text.split("\n\n") if chunk.strip()]
        structured = []
        for index, section in enumerate(contract.sections):
            if index < len(paragraphs):
                content = paragraphs[index]
            elif section.id == "open_question":
                content = _derive_open_question(paragraphs[0] if paragraphs else "")
            elif section.id == "caution":
                content = _SECTION_FALLBACK_TEXT["caution"]
            else:
                content = _SECTION_FALLBACK_TEXT.get(
                    section.id,
                    "Innehållet kunde inte struktureras som tänkt; luta dig mot originaltexten.",
                )
            structured.append(InterpretationSection(id=section.id, title=section.title, content=content))
        return structured, degraded


def _render_interpretation_text(sections: list[InterpretationSection]) -> str:
    parts: list[str] = []
    for section in sections:
        parts.append(f"{section.title}\n\n{section.content}")
    return "\n\n".join(parts)


def _contract_summary(contract: ContractSpec) -> InterpretationContract:
    return InterpretationContract(
        kind=contract.kind,  # type: ignore[arg-type]
        label=contract.label,
        tone=contract.tone,
        caution_level=contract.caution_level,  # type: ignore[arg-type]
        section_titles=[s.title for s in contract.sections],
    )


@router.post("/posts/{post_id}/interpret", response_model=InterpretResponse)
def interpret_post(
    post_id: int,
    body: InterpretRequestBody | None = Body(None),
    model: str | None = Query(None, description="Alternativ till body.model (bakåtkompatibilitet)."),
    user: CurrentUser | None = Depends(get_current_user_optional),
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI-tolkning är inte konfigurerad. OPENAI_API_KEY saknas.",
        )

    req = body if body is not None else InterpretRequestBody()
    raw_model = req.model if req.model is not None else model

    try:
        chosen_model, requested_meta = _resolve_model_choice(raw_model)
    except ValueError as e:
        bad = str(e)
        allowed = ", ".join(sorted(SUPPORTED_MODEL_IDS))
        raise HTTPException(
            status_code=400,
            detail=f"Modellen stöds inte: {bad}. Tillåtna id:n: {allowed}.",
        ) from e

    conn = get_connection()
    post = _get_post_with_concepts(conn, post_id)
    conn.close()
    if not post:
        raise HTTPException(status_code=404, detail="Posten hittades inte.")

    if post.get("Synlighet") != "publik":
        if user is None:
            raise HTTPException(status_code=404, detail="Posten hittades inte.")
        if user.anvandar_id != post["AnvandarID"] and not user.ar_admin:
            raise HTTPException(status_code=404, detail="Posten hittades inte.")

    user_kind = req.interpret_kind
    contract, effective_kind = _resolve_interpret_contract(user_kind, post.get("KategoriNamn"))

    text_for_match = f"{post.get('Titel', '')} {post.get('Innehall', '')}"
    try:
        all_concepts = concept_repo.get_all_concepts()
        matched = find_matches(text_for_match, all_concepts, include_phrases=True)
    except Exception:
        matched = []
    matched_top = matched[:15]
    system_prompt = _build_system_prompt(contract)
    user_content = _build_user_prompt(post, contract, matched_top, effective_kind, user_kind)

    try:
        import httpx
        from openai import OpenAI

        http_client = httpx.Client(timeout=60.0, follow_redirects=True, trust_env=False)
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY, http_client=http_client)
            response = client.chat.completions.create(
                model=chosen_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=1200,
                temperature=0.2,
            )
            raw_text = (response.choices[0].message.content or "").strip()
            api_model = (getattr(response, "model", None) or chosen_model or "").strip()
            fallback_used = api_model != chosen_model
            fallback_reason = (
                "Leverantören returnerade en annan modellidentifierare än den som beställdes."
                if fallback_used
                else None
            )

            if not raw_text:
                degraded = True
                text = (
                    "Modellen returnerade tomt innehåll. "
                    "Det kan bero på tillfälligt fel — försök igen om en stund."
                )
                sections, extra_deg = _structure_ai_response(text, contract)
                degraded = degraded or extra_deg
            else:
                sections, degraded = _structure_ai_response(raw_text, contract)

            return InterpretResponse(
                interpretation=_render_interpretation_text(sections),
                model_used=api_model,
                requested_model=requested_meta,
                used_model=api_model,
                fallback_used=fallback_used,
                fallback_reason=fallback_reason,
                provider="openai",
                contract_degraded=degraded,
                disclaimer=DISCLAIMER_TEXT,
                contract=_contract_summary(contract),
                sections=sections,
            )
        finally:
            http_client.close()
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        logger.exception("AI-tolkning misslyckades: %s", err_msg)
        if "rate" in err_msg.lower() or "quota" in err_msg.lower():
            raise HTTPException(503, "API-gräns nådd. Försök senare.") from e
        if "invalid" in err_msg.lower() and "model" in err_msg.lower():
            raise HTTPException(
                400,
                f"Modellen {chosen_model} kunde inte användas hos leverantören. Välj en annan modell eller kontrollera konto.",
            ) from e
        raise HTTPException(502, f"AI-tjänsten svarade inte: {err_msg[:200]}") from e


@router.get("/interpret/status", response_model=InterpretStatus)
def interpret_status():
    opts, verified, msg = _options_for_status()
    default_candidate = (settings.OPENAI_MODEL or "").strip()
    default_id = default_candidate if default_candidate in SUPPORTED_MODEL_IDS else DEFAULT_MODEL_ID
    if not any(m.id == default_id for m in opts):
        default_id = opts[0].id if opts else DEFAULT_MODEL_ID

    return InterpretStatus(
        available=bool(settings.OPENAI_API_KEY),
        model_default=default_id,
        model_options=opts,
        runtime_verification_succeeded=verified,
        runtime_verification_message=msg,
    )
