"""
Health-endpoints för Reflektionsarkiv.
Kontrollerar att backend och databas fungerar.
"""
from fastapi import APIRouter, HTTPException

from app.db import check_db_connection

router = APIRouter()


@router.get("/health")
def health():
    """
    Kontrollerar att backend är igång.
    Ingen databasanrop.
    """
    return {"status": "ok"}


@router.get("/db-health")
def db_health():
    """
    Kontrollerar att backend kan prata med MySQL.
    Returnerar 500 om anslutning misslyckas.
    """
    if check_db_connection():
        return {"status": "ok", "database": "connected"}
    raise HTTPException(
        status_code=500,
        detail="Database connection failed",
    )
