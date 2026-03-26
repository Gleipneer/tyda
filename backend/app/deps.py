"""FastAPI-beroenden: Bearer JWT → användar-ID."""
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.jwt_tokens import decode_access_token

_bearer_optional = HTTPBearer(auto_error=False)
_bearer_required = HTTPBearer(auto_error=True)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_required),
) -> int:
    """Kräver giltig Authorization: Bearer <JWT>."""
    try:
        return decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Ogiltig eller utgången session") from None


def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_optional),
) -> int | None:
    """Valfri JWT; None om saknas eller ogiltig."""
    if not credentials:
        return None
    try:
        return decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        return None
