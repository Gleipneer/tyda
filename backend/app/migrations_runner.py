"""
Kör database/migrations/*.sql i filnamnsordning via mysql-connector (UTF-8).
Gemensam kärna för: scripts/run_migration_utf8.py och FastAPI lifespan.

Idempotent där respektive SQL är skriven därefter (INSERT IGNORE, villkorliga hoppar).
"""
from __future__ import annotations

import logging
import os

import mysql.connector

from app.config import settings

logger = logging.getLogger("tyda.migrations")


def _emit_line(msg: str, *, emit: bool) -> None:
    if emit:
        print(msg, flush=True)


def _repo_root() -> str:
    # backend/app/migrations_runner.py -> backend -> repo
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _migrations_dir() -> str:
    return os.path.join(_repo_root(), "database", "migrations")


def run_migration_file(conn, path: str) -> None:
    with open(path, encoding="utf-8") as f:
        sql = f.read()
    sql = sql.replace("USE reflektionsarkiv;\n", "").replace("USE reflektionsarkiv;\r\n", "")
    cursor = conn.cursor()
    try:
        for result in cursor.execute(sql, multi=True):
            if result is not None:
                pass
    except Exception as e:
        logger.error("Migration SQL-fel %s: %s", path, str(e)[:200])
        raise
    finally:
        cursor.close()
    conn.commit()


def _skip_015_auth_columns(conn) -> bool:
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND LOWER(TABLE_NAME) = 'anvandare'
              AND COLUMN_NAME = 'LosenordHash'
            """
        )
        return cur.fetchone()[0] > 0
    finally:
        cur.close()


def _skip_016_poster_trigger(conn) -> bool:
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT COUNT(*) FROM information_schema.TRIGGERS
            WHERE TRIGGER_SCHEMA = DATABASE()
              AND TRIGGER_NAME = 'trigga_post_uppdaterad_logg'
            """
        )
        return cur.fetchone()[0] > 0
    finally:
        cur.close()


def list_migration_filenames() -> list[str]:
    """Alla *.sql i database/migrations, sorterade lexikografiskt (001, 002, …)."""
    d = _migrations_dir()
    if not os.path.isdir(d):
        return []
    names = sorted(
        f for f in os.listdir(d) if f.endswith(".sql") and not f.startswith(".")
    )
    return names


def run_all_migrations(*, emit: bool = True) -> None:
    """
    Ansluter med backend/.env (settings) och kör varje migration i ordning.
    emit: True skriver rader till stdout (synligt under uvicorn).
    """
    migrations_dir = _migrations_dir()
    files = list_migration_filenames()
    if not files:
        if emit:
            _emit_line(f"Varning: inga migrationsfiler i {migrations_dir}", emit=True)
        return

    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
    )
    try:
        for name in files:
            path = os.path.join(migrations_dir, name)
            if name == "015_add_auth_columns.sql" and _skip_015_auth_columns(conn):
                if emit:
                    _emit_line(f"Kör {name} ...", emit=True)
                    _emit_line("  Hoppar över (kolumnen finns redan, t.ex. från reflektionsarkiv.sql)", emit=True)
                continue
            if name == "016_add_poster_update_trigger.sql" and _skip_016_poster_trigger(conn):
                if emit:
                    _emit_line(f"Kör {name} ...", emit=True)
                    _emit_line("  Hoppar över (triggern finns redan, t.ex. från reflektionsarkiv.sql)", emit=True)
                continue
            if emit:
                _emit_line(f"Kör {name} ...", emit=True)
            run_migration_file(conn, path)
            if emit:
                _emit_line("  OK", emit=True)
    finally:
        conn.close()
    if emit:
        _emit_line("Klart.", emit=True)
