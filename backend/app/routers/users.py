"""Endpoints för användare."""
from fastapi import APIRouter, HTTPException

from app.repositories import user_repo
from app.schemas.users import UserRead, UserCreate

router = APIRouter()


def _row_to_user(row: dict) -> dict:
    """Mappar databasrad till API-format."""
    return {
        "anvandar_id": row["AnvandarID"],
        "anvandarnamn": row["Anvandarnamn"],
        "epost": row["Epost"],
        "skapad_datum": row["SkapadDatum"],
    }


@router.get("/users", response_model=list[UserRead])
def list_users():
    """Hämtar alla användare."""
    rows = user_repo.get_all_users()
    return [_row_to_user(r) for r in rows]


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    """Hämtar en användare."""
    row = user_repo.get_user_by_id(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return _row_to_user(row)


@router.post("/users", response_model=dict, status_code=201)
def create_user(data: UserCreate):
    """Skapar ny användare."""
    try:
        uid = user_repo.create_user(data.anvandarnamn, data.epost)
        user = user_repo.get_user_by_id(uid)
        return {"anvandar_id": uid, "anvandarnamn": user["Anvandarnamn"], "epost": user["Epost"]}
    except Exception as e:
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Epost already exists")
        raise HTTPException(status_code=500, detail=str(e))
