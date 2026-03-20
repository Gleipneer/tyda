"""Endpoints för poster med JWT och ägarskap."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import CurrentUser, assert_owner_or_admin, get_current_user, get_current_user_optional
from app.repositories import category_repo, post_repo
from app.schemas.posts import PostCreate, PostDetail, PostListItem, PostUpdate

router = APIRouter()


def _can_view_post(user: CurrentUser | None, post: dict) -> bool:
    if post["synlighet"] == "publik":
        return True
    if user is None:
        return False
    owner = post["anvandar"]["anvandar_id"]
    return user.anvandar_id == owner or user.ar_admin


@router.get("/posts/public", response_model=list[PostListItem])
def list_public_posts():
    """Hämtar offentliga poster."""
    return post_repo.get_public_posts()


@router.get("/posts/public/{post_id}", response_model=PostDetail)
def get_public_post(post_id: int):
    """Hämtar en offentlig post."""
    post = post_repo.get_public_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/posts", response_model=list[PostListItem])
def list_posts(
    user: CurrentUser = Depends(get_current_user),
    synlighet: str | None = Query(None),
    anvandar_id: int | None = Query(None),
):
    """
    Inloggad användare: egna poster (filtrerat med synlighet om angivet).
    Admin: alla poster; kan filtrera med anvandar_id och/eller synlighet.
    """
    if synlighet is not None and synlighet not in ("privat", "publik"):
        raise HTTPException(status_code=400, detail="Synlighet must be privat or publik")

    if user.ar_admin:
        return post_repo.get_all_posts(anvandar_id=anvandar_id, synlighet=synlighet)
    if anvandar_id is not None and anvandar_id != user.anvandar_id:
        raise HTTPException(status_code=403, detail="Du får inte lista andras poster")
    return post_repo.get_all_posts(anvandar_id=user.anvandar_id, synlighet=synlighet)


@router.get("/posts/{post_id}", response_model=PostDetail)
def get_post(
    post_id: int,
    user: CurrentUser | None = Depends(get_current_user_optional),
):
    """Publik post: utan inloggning. Privat: endast ägare eller admin."""
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if not _can_view_post(user, post):
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts", status_code=201)
def create_post(data: PostCreate, user: CurrentUser = Depends(get_current_user)):
    """Skapar ny post som inloggad användare. Trigger skapar AktivitetLogg."""
    if not data.titel or not data.titel.strip():
        raise HTTPException(status_code=400, detail="Titel is required")
    if not data.innehall or not data.innehall.strip():
        raise HTTPException(status_code=400, detail="Innehall is required")
    if data.synlighet not in ("privat", "publik"):
        raise HTTPException(status_code=400, detail="Synlighet must be privat or publik")

    if not category_repo.get_category_by_id(data.kategori_id):
        raise HTTPException(status_code=400, detail="Category not found")

    post_id = post_repo.create_post(
        user.anvandar_id,
        data.kategori_id,
        data.titel.strip(),
        data.innehall.strip(),
        data.synlighet,
    )
    return {"post_id": post_id, "message": "Post created"}


@router.put("/posts/{post_id}")
def update_post(post_id: int, data: PostUpdate, user: CurrentUser = Depends(get_current_user)):
    """Uppdaterar post om ägare eller admin."""
    existing = post_repo.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    assert_owner_or_admin(user, existing["anvandar"]["anvandar_id"])

    titel = data.titel if data.titel is not None else existing["titel"]
    innehall = data.innehall if data.innehall is not None else existing["innehall"]
    synlighet = data.synlighet if data.synlighet is not None else existing["synlighet"]
    kategori_id = data.kategori_id if data.kategori_id is not None else existing["kategori"]["kategori_id"]

    if data.kategori_id is not None and not category_repo.get_category_by_id(data.kategori_id):
        raise HTTPException(status_code=400, detail="Category not found")

    post_repo.update_post(post_id, titel, innehall, synlighet, kategori_id)
    return {"message": "Post updated"}


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, user: CurrentUser = Depends(get_current_user)):
    """Raderar post om ägare eller admin."""
    existing = post_repo.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    assert_owner_or_admin(user, existing["anvandar"]["anvandar_id"])
    post_repo.delete_post(post_id)
    return {"message": "Post deleted"}
