"""JWT åtkomsttoken – sub = AnvandarID (databasen är sanningskälla för ArAdmin)."""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def create_access_token(*, user_id: int) -> str:
    """Skapa signerad JWT. Innehåll: sub (användar-id), exp."""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> int:
    """
    Dekodera och validera JWT. Returnerar AnvandarID.
    Kastar jwt.InvalidTokenError vid fel.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
    )
    sub = payload.get("sub")
    if sub is None:
        raise jwt.InvalidTokenError("missing sub")
    return int(sub)
