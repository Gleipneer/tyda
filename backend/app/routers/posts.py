"""Endpoints för poster."""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user_id, get_optional_user_id
from app.repositories import user_repo, category_repo, post_repo
from app.schemas.posts import PostListItem, PostDetail, PostCreate, PostUpdate

router = APIRouter()


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
    anvandar_id: int | None = Query(None),
    synlighet: str | None = Query(None),
    jwt_user_id: int | None = Depends(get_optional_user_id),
):
    """Hämtar poster med valfri filtrering. Filtrering på anvandar_id kräver inloggning som samma användare."""
    if synlighet is not None and synlighet not in ("privat", "publik"):
        raise HTTPException(status_code=400, detail="Synlighet must be privat or publik")
    if anvandar_id is not None:
        if jwt_user_id is None:
            raise HTTPException(status_code=401, detail="Inloggning krävs för att filtrera på användare")
        if anvandar_id != jwt_user_id and not user_repo.is_admin(jwt_user_id):
            raise HTTPException(status_code=403, detail="Du kan bara lista dina egna poster med detta filter")
        return post_repo.get_all_posts(anvandar_id=anvandar_id, synlighet=synlighet)

    if jwt_user_id is None:
        raise HTTPException(status_code=401, detail="Inloggning krävs för att lista poster")
    if user_repo.is_admin(jwt_user_id):
        return post_repo.get_all_posts(anvandar_id=None, synlighet=synlighet)
    return post_repo.get_all_posts(anvandar_id=jwt_user_id, synlighet=synlighet)


@router.get("/posts/{post_id}", response_model=PostDetail)
def get_post(
    post_id: int,
    viewer_user_id: int | None = Query(None, deprecated=True),
    jwt_user_id: int | None = Depends(get_optional_user_id),
):
    """Hämtar en post i detalj. Privat post: kräver JWT som ägare (rekommenderat) eller viewer_user_id som matchar (bakåtkompatibilitet)."""
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    owner_id = post["anvandar"]["anvandar_id"]
    if post["synlighet"] != "publik":
        effective_viewer = jwt_user_id if jwt_user_id is not None else viewer_user_id
        allowed = effective_viewer == owner_id or (
            jwt_user_id is not None and user_repo.is_admin(jwt_user_id)
        )
        if not allowed:
            raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts", status_code=201)
def create_post(data: PostCreate, user_id: int = Depends(get_current_user_id)):
    """Skapar ny post. Trigger skapar AktivitetLogg. Ägare = inloggad användare."""
    if not data.titel or not data.titel.strip():
        raise HTTPException(status_code=400, detail="Titel is required")
    if not data.innehall or not data.innehall.strip():
        raise HTTPException(status_code=400, detail="Innehall is required")
    if data.synlighet not in ("privat", "publik"):
        raise HTTPException(status_code=400, detail="Synlighet must be privat or publik")

    if not user_repo.get_user_by_id(user_id):
        raise HTTPException(status_code=400, detail="User not found")
    if not category_repo.get_category_by_id(data.kategori_id):
        raise HTTPException(status_code=400, detail="Category not found")

    post_id = post_repo.create_post(
        user_id,
        data.kategori_id,
        data.titel.strip(),
        data.innehall.strip(),
        data.synlighet,
    )
    return {"post_id": post_id, "message": "Post created"}


@router.put("/posts/{post_id}")
def update_post(post_id: int, data: PostUpdate, user_id: int = Depends(get_current_user_id)):
    """Uppdaterar post. Endast ägare."""
    existing = post_repo.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    if existing["anvandar"]["anvandar_id"] != user_id:
        raise HTTPException(status_code=403, detail="Du kan bara redigera egna poster")

    titel = data.titel if data.titel is not None else existing["titel"]
    innehall = data.innehall if data.innehall is not None else existing["innehall"]
    synlighet = data.synlighet if data.synlighet is not None else existing["synlighet"]
    kategori_id = data.kategori_id if data.kategori_id is not None else existing["kategori"]["kategori_id"]

    if data.kategori_id is not None and not category_repo.get_category_by_id(data.kategori_id):
        raise HTTPException(status_code=400, detail="Category not found")

    n = post_repo.update_post(post_id, titel, innehall, synlighet, kategori_id)
    return {"message": "Post updated"}


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, user_id: int = Depends(get_current_user_id)):
    """Tar bort post och beroenden. Endast ägare."""
    existing = post_repo.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    if existing["anvandar"]["anvandar_id"] != user_id and not user_repo.is_admin(user_id):
        raise HTTPException(status_code=403, detail="Du kan bara ta bort egna poster")
    post_repo.delete_post(post_id)
    return {"message": "Post deleted"}
