"""
Beroenden för FastAPI: inloggad användare och admin.
Behörighetsflaggor läses alltid från databasen vid anrop (inte bara från token).
"""
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.jwt_util import decode_token
from app.repositories import user_repo

# auto_error=False så vi kan skilja 401 (saknas token) från valfri auth
_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    """Inloggad användare (från JWT + databasrad)."""

    anvandar_id: int
    ar_admin: bool


def get_current_user_optional(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser | None:
    """Returnerar CurrentUser om giltig Bearer-token, annars None."""
    if creds is None or not creds.credentials:
        return None
    try:
        uid = decode_token(creds.credentials)
    except jwt.PyJWTError:
        return None
    row = user_repo.get_user_by_id(uid)
    if not row:
        return None
    return CurrentUser(anvandar_id=uid, ar_admin=bool(row.get("ArAdmin", 0)))


def get_current_user(user: CurrentUser | None = Depends(get_current_user_optional)) -> CurrentUser:
    """Kräver inloggning."""
    if user is None:
        raise HTTPException(status_code=401, detail="Du måste logga in")
    return user


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Kräver administratör (ArAdmin=1 i databasen)."""
    if not user.ar_admin:
        raise HTTPException(status_code=403, detail="Endast administratör")
    return user


def assert_owner_or_admin(user: CurrentUser, post_owner_anvandar_id: int) -> None:
    """Kasta 403 om varken ägare eller admin."""
    if user.ar_admin or user.anvandar_id == post_owner_anvandar_id:
        return
    raise HTTPException(status_code=403, detail="Du får inte utföra denna åtgärd på posten")
