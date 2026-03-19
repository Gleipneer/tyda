"""Pydantic-scheman för användare."""
from datetime import datetime
from pydantic import BaseModel


class UserRead(BaseModel):
    """Response för en användare."""

    anvandar_id: int
    anvandarnamn: str
    epost: str
    skapad_datum: datetime
    ar_admin: bool = False


class UserCreate(BaseModel):
    """Request för att skapa användare."""

    anvandarnamn: str
    epost: str
    losenord: str
