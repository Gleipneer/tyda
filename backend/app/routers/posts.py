"""Endpoints för poster."""
from fastapi import APIRouter, HTTPException, Query

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
):
    """Hämtar poster med valfri filtrering."""
    if synlighet is not None and synlighet not in ("privat", "delad", "publik"):
        raise HTTPException(status_code=400, detail="Synlighet must be privat, delad or publik")
    return post_repo.get_all_posts(anvandar_id=anvandar_id, synlighet=synlighet)


@router.get("/posts/{post_id}", response_model=PostDetail)
def get_post(post_id: int, viewer_user_id: int | None = Query(None)):
    """Hämtar en post i detalj."""
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["synlighet"] != "publik" and viewer_user_id != post["anvandar"]["anvandar_id"]:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/posts", status_code=201)
def create_post(data: PostCreate):
    """Skapar ny post. Trigger skapar AktivitetLogg."""
    if not data.titel or not data.titel.strip():
        raise HTTPException(status_code=400, detail="Titel is required")
    if not data.innehall or not data.innehall.strip():
        raise HTTPException(status_code=400, detail="Innehall is required")
    if data.synlighet not in ("privat", "delad", "publik"):
        raise HTTPException(status_code=400, detail="Synlighet must be privat, delad or publik")

    if not user_repo.get_user_by_id(data.anvandar_id):
        raise HTTPException(status_code=400, detail="User not found")
    if not category_repo.get_category_by_id(data.kategori_id):
        raise HTTPException(status_code=400, detail="Category not found")

    post_id = post_repo.create_post(
        data.anvandar_id,
        data.kategori_id,
        data.titel.strip(),
        data.innehall.strip(),
        data.synlighet,
    )
    return {"post_id": post_id, "message": "Post created"}


@router.put("/posts/{post_id}")
def update_post(post_id: int, data: PostUpdate):
    """Uppdaterar post."""
    existing = post_repo.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")

    titel = data.titel if data.titel is not None else existing["titel"]
    innehall = data.innehall if data.innehall is not None else existing["innehall"]
    synlighet = data.synlighet if data.synlighet is not None else existing["synlighet"]
    kategori_id = data.kategori_id if data.kategori_id is not None else existing["kategori"]["kategori_id"]

    if data.kategori_id is not None and not category_repo.get_category_by_id(data.kategori_id):
        raise HTTPException(status_code=400, detail="Category not found")

    n = post_repo.update_post(post_id, titel, innehall, synlighet, kategori_id)
    return {"message": "Post updated"}


@router.delete("/posts/{post_id}")
def delete_post(post_id: int):
    """Tar bort post och beroenden."""
    existing = post_repo.get_post_by_id(post_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    post_repo.delete_post(post_id)
    return {"message": "Post deleted"}
