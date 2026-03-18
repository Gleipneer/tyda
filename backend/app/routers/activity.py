"""Endpoints för aktivitetslogg."""
from fastapi import APIRouter, HTTPException

from app.repositories import activity_repo, post_repo

router = APIRouter()


@router.get("/activity")
def list_activity():
    """Hämtar hela aktivitetsloggen."""
    return activity_repo.get_all_activity()


@router.get("/activity/post/{post_id}")
def list_activity_for_post(post_id: int):
    """Hämtar aktivitet för en post."""
    if not post_repo.get_post_by_id(post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return activity_repo.get_activity_by_post_id(post_id)
