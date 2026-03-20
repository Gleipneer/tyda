"""
Health-endpoints för Reflektionsarkiv.
Kontrollerar att backend och databas fungerar.
"""
from typing import Any

from fastapi import APIRouter, HTTPException

from app.db import check_db_connection, get_mysql_connection_identity

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

    Inkluderar vilket MySQL-konto anslutningen använder (CURRENT_USER) så att
    least privilege från database/scripts/grants.sql kan verifieras.
    """
    if not check_db_connection():
        raise HTTPException(
            status_code=500,
            detail="Database connection failed",
        )
    ident = get_mysql_connection_identity()
    out: dict[str, Any] = {
        "status": "ok",
        "database": "connected",
        "privilege_source": "database_grants",
        "privilege_script": "database/scripts/grants.sql",
    }
    if ident:
        out["mysql_connection_as"] = ident["current_user"]
        out["mysql_session_user"] = ident["session_user"]
    return out
