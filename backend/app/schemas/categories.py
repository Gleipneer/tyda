"""Pydantic-scheman för kategorier."""
from pydantic import BaseModel


class CategoryRead(BaseModel):
    """Response för en kategori."""

    kategori_id: int
    namn: str
    beskrivning: str | None
