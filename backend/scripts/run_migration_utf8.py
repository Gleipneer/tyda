"""
Kör migration med korrekt UTF-8 och spårning i schema_migrations.

Root cause (Windows): mysql CLI cp850 korrumperar åäö vid pipning.
Lösning: mysql-connector-python med charset=utf8mb4.

Kör från backend-katalogen: python scripts/run_migration_utf8.py
Se database/migrations/README.md
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mysql.connector
from app.config import settings

MIGRATIONS: tuple[str, ...] = (
    "001_expand_begrepp.sql",
    "002_enrich_begrepp.sql",
    "003_lexicon_250.sql",
    "004_add_kansla.sql",
    "005_drop_kommentarer.sql",
    "006_lexicon_extended.sql",
    "007_lexicon_dromtolkning.sql",
    "008_precision_dromtolkning.sql",
    "009_database_truth_consolidation.sql",
    "010_drop_relationtyp.sql",
    "011_drop_kommentar.sql",
    "012_drop_idx_postbegrepp_post.sql",
    "013_synlighet_privat_publik.sql",
    "014_add_check_titel.sql",
    "015_add_auth_columns.sql",
    "016_add_poster_update_trigger.sql",
    "017_metall_kropp_daniel.sql",
)

try:
    from app.migrations_meta import MIGRATION_COUNT as _EXPECTED_MIGRATION_COUNT

    assert len(MIGRATIONS) == _EXPECTED_MIGRATION_COUNT, (
        f"MIGRATIONS har {len(MIGRATIONS)} filer; uppdatera app/migrations_meta.MIGRATION_COUNT"
    )
except ImportError:
    pass

# Minsta antal rader i Begrepp för att anta att lexikon redan är migrerat (äldre installation utan spårning)
LEGACY_BEGREPP_THRESHOLD = 80


def _project_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _migrations_dir() -> str:
    return os.path.join(_project_root(), "database", "migrations")


def ensure_schema_migrations_table(conn) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            migration_name VARCHAR(128) NOT NULL PRIMARY KEY,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    )
    conn.commit()
    cur.close()


def is_migration_applied(conn, name: str) -> bool:
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM schema_migrations WHERE migration_name = %s", (name,))
    row = cur.fetchone()
    cur.close()
    return row is not None


def mark_migration_applied(conn, name: str) -> None:
    cur = conn.cursor()
    cur.execute(
        "INSERT IGNORE INTO schema_migrations (migration_name) VALUES (%s)",
        (name,),
    )
    conn.commit()
    cur.close()


def count_begrepp(conn) -> int:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM Begrepp")
    n = int(cur.fetchone()[0])
    cur.close()
    return n


def count_schema_migrations(conn) -> int:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM schema_migrations")
    n = int(cur.fetchone()[0])
    cur.close()
    return n


def run_migration_file(conn, path: str) -> None:
    """Läs och kör SQL-fil som UTF-8."""
    with open(path, encoding="utf-8") as f:
        sql = f.read()
    sql = sql.replace("USE reflektionsarkiv;\n", "").replace("USE reflektionsarkiv;\r\n", "")
    cursor = conn.cursor()
    try:
        for _ in cursor.execute(sql, multi=True):
            pass
    except Exception as e:
        print("Fel:", str(e)[:200])
        raise
    cursor.close()
    conn.commit()


def should_skip_015_auth_columns(conn) -> bool:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND LOWER(TABLE_NAME) = 'anvandare'
          AND COLUMN_NAME = 'LosenordHash'
        """
    )
    ok = cur.fetchone()[0] > 0
    cur.close()
    return ok


def should_skip_016_poster_trigger(conn) -> bool:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT COUNT(*) FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
          AND TRIGGER_NAME = 'trigga_post_uppdaterad_logg'
        """
    )
    ok = cur.fetchone()[0] > 0
    cur.close()
    return ok


def mark_all_applied(conn) -> None:
    for name in MIGRATIONS:
        path = os.path.join(_migrations_dir(), name)
        if os.path.exists(path):
            mark_migration_applied(conn, name)
            print(f"Markerad som körning: {name}")


def legacy_bootstrap(conn) -> bool:
    """
    Om databasen redan innehåller lexikon men saknar schema_migrations,
    registrera alla migrationer utan att köra SQL (undviker duplicate INSERT).
    """
    ensure_schema_migrations_table(conn)
    if count_schema_migrations(conn) > 0:
        print("schema_migrations är inte tom — inget legacy-bootstrap.")
        return False
    n = count_begrepp(conn)
    if n < LEGACY_BEGREPP_THRESHOLD:
        print(
            f"Begrepp-rader ({n}) < {LEGACY_BEGREPP_THRESHOLD} — "
            "antar att migrationer ska köras normalt. Inget legacy-bootstrap."
        )
        return False
    print(
        f"Legacy: {n} begrepp i databasen, men ingen spårning. "
        f"Markerar alla {len(MIGRATIONS)} migrationer som körda (ingen SQL körs)."
    )
    mark_all_applied(conn)
    return True


def run_migrations(conn) -> None:
    ensure_schema_migrations_table(conn)
    mdir = _migrations_dir()
    for name in MIGRATIONS:
        path = os.path.join(mdir, name)
        if not os.path.exists(path):
            print(f"Hoppar över {name} (finns inte)")
            continue
        if is_migration_applied(conn, name):
            print(f"Redan körd: {name}")
            continue

        if name == "015_add_auth_columns.sql":
            if should_skip_015_auth_columns(conn):
                print("Kör", name, "...")
                print("  Hoppar över (kolumnen LosenordHash finns redan)")
                mark_migration_applied(conn, name)
                continue

        if name == "016_add_poster_update_trigger.sql":
            if should_skip_016_poster_trigger(conn):
                print("Kör", name, "...")
                print("  Hoppar över (triggern trigga_post_uppdaterad_logg finns redan)")
                mark_migration_applied(conn, name)
                continue

        print("Kör", name, "...")
        run_migration_file(conn, path)
        mark_migration_applied(conn, name)
        print("  OK")
    print("Klart.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Kör databasmigrationer med UTF-8 och spårning.")
    parser.add_argument(
        "--mark-only",
        action="store_true",
        help="Registrera alla kända migrationer som körda utan att köra SQL (avancerat).",
    )
    parser.add_argument(
        "--legacy-bootstrap",
        action="store_true",
        help="Om schema_migrations är tom och Begrepp är stort: markera alla (se README).",
    )
    args = parser.parse_args()

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
        ensure_schema_migrations_table(conn)
        if args.mark_only:
            print("Läget --mark-only: registrerar alla migrationer utan SQL.")
            mark_all_applied(conn)
            print("Klart.")
            return
        if args.legacy_bootstrap:
            if legacy_bootstrap(conn):
                print("Klart.")
            else:
                print(
                    "Ingen legacy-bootstrap utförd (t.ex. schema_migrations redan ifylld, "
                    f"eller färre än {LEGACY_BEGREPP_THRESHOLD} begrepp)."
                )
            return
        run_migrations(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
