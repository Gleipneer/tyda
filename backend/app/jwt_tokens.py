"""JWT access tokens (HS256) för autentiserade API-anrop."""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def create_access_token(subject_user_id: int) -> str:
    """Skapar signerad JWT med sub = användar-ID."""
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {
        "sub": str(subject_user_id),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> int:
    """
    Validerar JWT och returnerar användar-ID.
    Raises jwt.PyJWTError vid ogiltig eller utgången token.
    """
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    sub = decoded.get("sub")
    if sub is None:
        raise jwt.InvalidTokenError("missing sub")
    return int(sub)
