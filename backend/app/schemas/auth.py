"""Inloggning."""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """E-post (eller texten admin för administratör) + lösenord."""

    identifier: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=256)
