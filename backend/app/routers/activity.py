"""Endpoints för aktivitetslogg."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user_id
from app.repositories import activity_repo, post_repo, user_repo

router = APIRouter()


@router.get("/activity")
def list_activity(user_id: int = Depends(get_current_user_id)):
    """Hämtar aktivitetslogg: hela systemet för admin, annars bara för egna poster."""
    if user_repo.is_admin(user_id):
        return activity_repo.get_all_activity()
    return activity_repo.get_activity_for_post_owner(user_id)


@router.get("/activity/post/{post_id}")
def list_activity_for_post(post_id: int, user_id: int = Depends(get_current_user_id)):
    """Hämtar aktivitet för en post. Privat post: endast ägare eller admin."""
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    owner_id = post["anvandar"]["anvandar_id"]
    if post["synlighet"] != "publik":
        if owner_id != user_id and not user_repo.is_admin(user_id):
            raise HTTPException(status_code=404, detail="Post not found")
    return activity_repo.get_activity_by_post_id(post_id)
