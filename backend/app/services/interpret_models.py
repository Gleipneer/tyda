"""
Enda katalogen för AI-modeller som Tyda kan erbjuda i interpret-flödet.
Filtreras valfritt med OPENAI_MODEL_ALLOWLIST (kommaseparerade id:n).
"""
from __future__ import annotations

from app.config import settings
from app.schemas.interpret import SupportedModel

# Fullständig katalog — ordning = visningsordning i UI / fallback-ordning
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

SUPPORTED_MODEL_IDS: frozenset[str] = frozenset(m.id for m in SUPPORTED_MODELS)
_DEFAULT_FIRST = SUPPORTED_MODELS[0].id


def _parse_allowlist(raw: str) -> frozenset[str] | None:
    s = (raw or "").strip()
    if not s:
        return None
    parts = frozenset(p.strip() for p in s.split(",") if p.strip())
    return parts if parts else None


def allowed_model_objects() -> tuple[SupportedModel, ...]:
    """Modeller som får exponeras och anropas (katalog ∩ allowlist)."""
    allow = _parse_allowlist(settings.OPENAI_MODEL_ALLOWLIST or "")
    if allow is None:
        return SUPPORTED_MODELS
    filtered = tuple(m for m in SUPPORTED_MODELS if m.id in allow)
    return filtered if filtered else SUPPORTED_MODELS


def allowed_model_ids() -> frozenset[str]:
    return frozenset(m.id for m in allowed_model_objects())


def default_model_id() -> str:
    """Default när klienten inte skickar modell: OPENAI_MODEL om tillåten, annars första tillåtna."""
    allowed = allowed_model_ids()
    pref = (settings.OPENAI_MODEL or "").strip()
    if pref in allowed:
        return pref
    for m in allowed_model_objects():
        if m.id in allowed:
            return m.id
    return _DEFAULT_FIRST


def resolve_requested_model_id(explicit: str | None) -> tuple[str, bool]:
    """
    Returnerar (model_id, was_explicit).
    explicit satt men ogiltigt → ValueError med meddelande (400 till klient).
    """
    allowed = allowed_model_ids()
    if explicit is not None and explicit.strip() != "":
        rid = explicit.strip()
        if rid not in allowed:
            opts = ", ".join(sorted(allowed))
            raise ValueError(f"Modellen '{rid}' stöds inte. Tillåtna id:n: {opts}")
        return rid, True
    return default_model_id(), False


def uses_new_token_param(model_id: str) -> bool:
    """GPT-5 / o-serien: max_completion_tokens, ingen temperature i Chat Completions."""
    mid = model_id.lower()
    return mid.startswith("gpt-5") or mid.startswith("o1") or mid.startswith("o3") or mid.startswith("o4")
