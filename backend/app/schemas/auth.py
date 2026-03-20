"""Inloggning."""
from pydantic import BaseModel, Field

from app.schemas.users import UserRead


class LoginRequest(BaseModel):
    """E-post (eller texten admin för administratör) + lösenord."""

    identifier: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=256)


class TokenResponse(BaseModel):
    """Svar vid lyckad inloggning eller registrering med token."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead
