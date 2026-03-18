"""Pydantic-scheman för begrepp."""
from pydantic import BaseModel


class ConceptRead(BaseModel):
    begrepp_id: int
    ord: str
    beskrivning: str


class ConceptCreate(BaseModel):
    ord: str
    beskrivning: str


class PostConceptRead(BaseModel):
    post_begrepp_id: int
    relation_typ: str
    kommentar: str | None
    begrepp: ConceptRead


class PostConceptCreate(BaseModel):
    begrepp_id: int
    relation_typ: str = "huvudsymbol"
    kommentar: str | None = None
