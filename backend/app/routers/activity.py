"""Endpoints för aktivitetslogg."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import CurrentUser, assert_owner_or_admin, get_current_user
from app.repositories import activity_repo, post_repo

router = APIRouter()


@router.get("/activity")
def list_activity(user: CurrentUser = Depends(get_current_user)):
    """Admin: hela loggen. Vanlig användare: bara egna poster."""
    if user.ar_admin:
        return activity_repo.get_all_activity()
    return activity_repo.get_activity_for_anvandares_poster(user.anvandar_id)


@router.get("/activity/post/{post_id}")
def list_activity_for_post(post_id: int, user: CurrentUser = Depends(get_current_user)):
    """Aktivitet för en post om du får läsa posten (ägare eller admin)."""
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    assert_owner_or_admin(user, post["anvandar"]["anvandar_id"])
    return activity_repo.get_activity_by_post_id(post_id)
