"""Svar med access token + användarprofil."""
from pydantic import BaseModel

from app.schemas.users import UserRead


class AuthResponse(BaseModel):
    """Efter lyckad inloggning eller registrering."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead
