"""Endpoints för användare."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import CurrentUser, get_current_user
from app.jwt_util import create_access_token
from app.repositories import user_repo
from app.schemas.auth import TokenResponse
from app.schemas.users import UserRead, UserCreate
from app.security import hash_password

router = APIRouter()


def _row_to_user(row: dict) -> UserRead:
    return UserRead(
        anvandar_id=row["AnvandarID"],
        anvandarnamn=row["Anvandarnamn"],
        epost=row["Epost"],
        skapad_datum=row["SkapadDatum"],
        ar_admin=bool(row.get("ArAdmin", 0)),
    )


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, user: CurrentUser = Depends(get_current_user)):
    """Hämtar en användare. Endast sig själv eller admin."""
    if user.anvandar_id != user_id and not user.ar_admin:
        raise HTTPException(status_code=403, detail="Du får inte läsa denna användare")
    row = user_repo.get_user_by_id(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return _row_to_user(row)


@router.post("/users", response_model=TokenResponse, status_code=201)
def create_user(data: UserCreate):
    """Skapar nytt konto (icke-admin) och loggar in med JWT."""
    if len(data.losenord) < 8:
        raise HTTPException(status_code=400, detail="Lösenord måste vara minst 8 tecken")
    try:
        pwd_hash = hash_password(data.losenord)
        uid = user_repo.create_user(
            data.anvandarnamn.strip(),
            data.epost.strip().lower(),
            pwd_hash,
            ar_admin=0,
        )
        row = user_repo.get_user_by_id(uid)
        u = _row_to_user(row)
        token = create_access_token(user_id=u.anvandar_id)
        return TokenResponse(access_token=token, user=u)
    except Exception as e:
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Epost already exists")
        raise HTTPException(status_code=500, detail=str(e))
