"""Pydantic-scheman för AI-tolkning."""
from typing import Literal

from pydantic import BaseModel, Field


InterpretKind = Literal["dream", "poem", "reflection"]
CautionLevel = Literal["high", "medium"]


class SupportedModel(BaseModel):
    """Modell som backend faktiskt exponerar till klienten."""

    id: str
    label: str
    description: str


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
    disclaimer: str
    contract: InterpretationContract
    sections: list[InterpretationSection]
    # Ord som automatchats i texten (ingen DB-persistens; endast visning)
    matched_highlight: list[str] = Field(default_factory=list)


class InterpretStatus(BaseModel):
    """Status och modellstöd för AI-funktionen."""

    available: bool
    model_default: str
    model_options: list[SupportedModel]
