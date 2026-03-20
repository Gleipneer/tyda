"""Pydantic-scheman för AI-tolkning."""
from typing import Literal

from pydantic import BaseModel, Field


InterpretKind = Literal[
    "dream",
    "poem",
    "reflection",
    "text_excerpt",
    "symbol_focus",
    "event_experience",
    "relation_situation",
    "free",
]
CautionLevel = Literal["high", "medium"]

INTERPRET_KIND_VALUES: frozenset[str] = frozenset(
    (
        "dream",
        "poem",
        "reflection",
        "text_excerpt",
        "symbol_focus",
        "event_experience",
        "relation_situation",
        "free",
    )
)


class InterpretRequestBody(BaseModel):
    """Kropp för POST /posts/{id}/interpret (query-param `model` stöds fortfarande som alternativ)."""

    model: str | None = None
    interpret_kind: InterpretKind | None = None


class SupportedModel(BaseModel):
    """Modell som backend kan erbjuda till klienten."""

    id: str
    label: str
    description: str
    runtime_available: bool = Field(
        default=True,
        description="False om runtime-listan sades nej till just denna modell-id.",
    )


class InterpretationSection(BaseModel):
    """En strukturerad del i AI-svaret."""

    id: str
    title: str
    content: str


class InterpretationContract(BaseModel):
    """Sammanfattning av vilket tolkningskontrakt som användes."""

    kind: InterpretKind
    label: str
    tone: str
    caution_level: CautionLevel
    section_titles: list[str]


class InterpretResponse(BaseModel):
    """Strukturerat AI-svar för en post."""

    interpretation: str
    model_used: str
    requested_model: str | None = None
    used_model: str
    fallback_used: bool = False
    fallback_reason: str | None = None
    provider: str = "openai"
    contract_degraded: bool = False
    disclaimer: str
    contract: InterpretationContract
    sections: list[InterpretationSection]


class InterpretStatus(BaseModel):
    """Status och modellstöd för AI-funktionen."""

    available: bool
    model_default: str
    model_options: list[SupportedModel]
    runtime_verification_succeeded: bool = False
    runtime_verification_message: str | None = None
