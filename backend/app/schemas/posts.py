"""Pydantic-scheman för poster."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class UserRef(BaseModel):
    """Kort användarreferens i post."""

    anvandar_id: int
    anvandarnamn: str


class CategoryRef(BaseModel):
    """Kort kategorireferens i post."""

    kategori_id: int
    namn: str


class PostListItem(BaseModel):
    """Post i listvy."""

    post_id: int
    titel: str
    innehall: str
    synlighet: Literal["privat", "publik"]
    skapad_datum: datetime
    anvandar: UserRef
    kategori: CategoryRef


class PostDetail(PostListItem):
    """Post i detaljvy – samma som listitem för nu."""

    pass


class PostCreate(BaseModel):
    """Request för att skapa post. Ägare sätts från JWT, inte från klienten."""

    kategori_id: int
    titel: str
    innehall: str
    synlighet: Literal["privat", "publik"] = "privat"


class PostUpdate(BaseModel):
    """Request för att uppdatera post."""

    titel: str | None = None
    innehall: str | None = None
    synlighet: Literal["privat", "publik"] | None = None
    kategori_id: int | None = None
