"""Admin-endpoints. Alla kräver JWT + ArAdmin=1."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import require_admin
from app.repositories import concept_repo, post_repo, user_repo
from app.schemas.posts import PostListItem
from app.schemas.users import AdminUserCreate, UserRead
from app.security import hash_password

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/admin/stats")
def admin_stats():
    """Antal användare, poster och begrepp."""
    return {
        "antal_anvandare": user_repo.count_users(),
        "antal_poster": post_repo.count_posts(),
        "antal_begrepp": concept_repo.count_begrepp(),
    }


@router.get("/admin/users", response_model=list[UserRead])
def admin_list_users():
    rows = user_repo.list_all_users()
    return [_user_read_from_row(r) for r in rows]


@router.post("/admin/users", response_model=UserRead, status_code=201)
def admin_create_user(data: AdminUserCreate):
    """Skapar användare med valfri admin-roll (lösenord hashas som vid vanlig registrering)."""
    if len(data.losenord) < 8:
        raise HTTPException(status_code=400, detail="Lösenord måste vara minst 8 tecken")
    try:
        pwd_hash = hash_password(data.losenord)
        uid = user_repo.create_user(
            data.anvandarnamn.strip(),
            data.epost.strip().lower(),
            pwd_hash,
            ar_admin=1 if data.ar_admin else 0,
        )
        row = user_repo.get_user_by_id(uid)
        return _user_read_from_row(row)
    except Exception as e:
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Epost finns redan")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/posts", response_model=list[PostListItem])
def admin_list_posts():
    """Alla poster."""
    return post_repo.get_all_posts()


def _user_read_from_row(row: dict) -> UserRead:
    return UserRead(
        anvandar_id=row["AnvandarID"],
        anvandarnamn=row["Anvandarnamn"],
        epost=row["Epost"],
        skapad_datum=row["SkapadDatum"],
        ar_admin=bool(row.get("ArAdmin", 0)),
    )
