"""Autentisering (lösenordskontroll mot databasen)."""
from fastapi import APIRouter, HTTPException

from app.repositories import user_repo
from app.schemas.auth import LoginRequest
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


@router.post("/auth/login", response_model=UserRead)
def login(data: LoginRequest):
    """Verifierar lösenord och returnerar användaren utan känsliga fält."""
    row = user_repo.get_user_with_hash_by_identifier(data.identifier.strip())
    if not row:
        raise HTTPException(status_code=401, detail="Felaktig e-post eller lösenord")
    if not verify_password(data.password, row["LosenordHash"]):
        raise HTTPException(status_code=401, detail="Felaktig e-post eller lösenord")
    public = {k: v for k, v in row.items() if k != "LosenordHash"}
    return _row_to_user_read(public)
