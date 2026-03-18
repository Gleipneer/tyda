"""Endpoints för analys."""
from fastapi import APIRouter

from app.repositories import analytics_repo

router = APIRouter()


@router.get("/analytics/posts-per-category")
def posts_per_category():
    """Antal poster per kategori."""
    return analytics_repo.get_posts_per_category()


@router.get("/analytics/posts-per-user")
def posts_per_user():
    """Antal poster per användare."""
    return analytics_repo.get_posts_per_user()


@router.get("/analytics/most-used-concepts")
def most_used_concepts():
    """Mest använda begrepp."""
    return analytics_repo.get_most_used_concepts()
