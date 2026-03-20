"""Autentisering: inloggning och /me med JWT."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import CurrentUser, get_current_user
from app.jwt_util import create_access_token
from app.repositories import user_repo
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.users import UserRead
from app.security import verify_password

router = APIRouter()


def _row_to_user_read(row: dict) -> UserRead:
    return UserRead(
        anvandar_id=row["AnvandarID"],
        anvandarnamn=row["Anvandarnamn"],
        epost=row["Epost"],
        skapad_datum=row["SkapadDatum"],
        ar_admin=bool(row.get("ArAdmin", 0)),
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest):
    """Verifierar lösenord och returnerar JWT + användare."""
    row = user_repo.get_user_with_hash_by_identifier(data.identifier.strip())
    if not row:
        raise HTTPException(status_code=401, detail="Felaktig e-post eller lösenord")
    if not verify_password(data.password, row["LosenordHash"]):
        raise HTTPException(status_code=401, detail="Felaktig e-post eller lösenord")
    public = {k: v for k, v in row.items() if k != "LosenordHash"}
    user = _row_to_user_read(public)
    token = create_access_token(user_id=user.anvandar_id)
    return TokenResponse(access_token=token, user=user)


@router.get("/auth/me", response_model=UserRead)
def me(user: CurrentUser = Depends(get_current_user)):
    """Nuvarande användare utifrån token (ArAdmin alltid från databasen)."""
    row = user_repo.get_user_by_id(user.anvandar_id)
    if not row:
        raise HTTPException(status_code=401, detail="Ogiltig session")
    return _row_to_user_read(row)
