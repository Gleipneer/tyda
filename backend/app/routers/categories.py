"""Endpoints för kategorier."""
from fastapi import APIRouter, HTTPException

from app.repositories import category_repo
from app.schemas.categories import CategoryRead

router = APIRouter()


def _row_to_category(row: dict) -> dict:
    """Mappar databasrad till API-format."""
    return {
        "kategori_id": row["KategoriID"],
        "namn": row["Namn"],
        "beskrivning": row["Beskrivning"],
    }


@router.get("/categories", response_model=list[CategoryRead])
def list_categories():
    """Hämtar alla kategorier."""
    rows = category_repo.get_all_categories()
    return [_row_to_category(r) for r in rows]


@router.get("/categories/{category_id}", response_model=CategoryRead)
def get_category(category_id: int):
    """Hämtar en kategori."""
    row = category_repo.get_category_by_id(category_id)
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    return _row_to_category(row)
