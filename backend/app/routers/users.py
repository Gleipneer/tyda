"""Endpoints för användare."""
from fastapi import APIRouter, HTTPException

from app.jwt_tokens import create_access_token
from app.repositories import user_repo
from app.schemas.tokens import AuthResponse
from app.schemas.users import UserRead, UserCreate
from app.security import hash_password

router = APIRouter()


def _row_to_user(row: dict) -> dict:
    """Mappar databasrad till API-format."""
    return {
        "anvandar_id": row["AnvandarID"],
        "anvandarnamn": row["Anvandarnamn"],
        "epost": row["Epost"],
        "skapad_datum": row["SkapadDatum"],
        "ar_admin": bool(row.get("ArAdmin", 0)),
    }


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    """Hämtar en användare."""
    row = user_repo.get_user_by_id(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return _row_to_user(row)


@router.post("/users", response_model=AuthResponse, status_code=201)
def create_user(data: UserCreate):
    """Skapar ny användare med hashat lösenord (minst 8 tecken). Returnerar JWT + profil."""
    if len(data.losenord) < 8:
        raise HTTPException(status_code=400, detail="Lösenord måste vara minst 8 tecken")
    try:
        pwd_hash = hash_password(data.losenord)
        uid = user_repo.create_user(data.anvandarnamn.strip(), data.epost.strip().lower(), pwd_hash)
        user = user_repo.get_user_by_id(uid)
        uread = _row_to_user(user)
        token = create_access_token(uread["anvandar_id"])
        return AuthResponse(access_token=token, user=UserRead(**uread))
    except Exception as e:
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Epost already exists")
        raise HTTPException(status_code=500, detail=str(e))
