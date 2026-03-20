"""Endpoints för analys – inloggning krävs; admin ser allt, annars bara egen statistik."""
from fastapi import APIRouter, Depends

from app.deps import CurrentUser, get_current_user
from app.repositories import analytics_repo

router = APIRouter()


@router.get("/analytics/posts-per-category")
def posts_per_category(user: CurrentUser = Depends(get_current_user)):
    if user.ar_admin:
        return analytics_repo.get_posts_per_category()
    return analytics_repo.get_posts_per_category_for_user(user.anvandar_id)


@router.get("/analytics/posts-per-user")
def posts_per_user(user: CurrentUser = Depends(get_current_user)):
    if user.ar_admin:
        return analytics_repo.get_posts_per_user()
    return analytics_repo.get_posts_per_user_self(user.anvandar_id)


@router.get("/analytics/most-used-concepts")
def most_used_concepts(user: CurrentUser = Depends(get_current_user)):
    if user.ar_admin:
        return analytics_repo.get_most_used_concepts()
    return analytics_repo.get_most_used_concepts_for_user(user.anvandar_id)
