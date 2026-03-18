"""
Reparera Begrepp-tabellen: Ord-kolumnen är korrupt (?? istället för åäö).
Root cause: Migrationer kördes via mysql CLI med cp850.
Lösning: Rensa Begrepp och PostBegrepp, kör migrationer med UTF-8.
OBS: Manuella begrepp-kopplingar (PostBegrepp) tas bort.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mysql.connector
from app.config import settings

# Import from sibling module
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "run_migration_utf8",
    os.path.join(os.path.dirname(__file__), "run_migration_utf8.py"),
)
_run = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_run)
run_migration_file = _run.run_migration_file

def main():
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    migrations_dir = os.path.join(base, "database", "migrations")

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
        cursor = conn.cursor()
        print("Tar bort PostBegrepp...")
        cursor.execute("DELETE FROM PostBegrepp")
        print("Tar bort Begrepp...")
        cursor.execute("DELETE FROM Begrepp")
        conn.commit()
        cursor.close()

        for name in ["001_expand_begrepp.sql", "002_enrich_begrepp.sql", "003_lexicon_250.sql", "004_add_kansla.sql"]:
            path = os.path.join(migrations_dir, name)
            if os.path.exists(path):
                print("Kör", name, "...")
                run_migration_file(conn, path)
                print("  OK")
        print("Klart. Begrepp återställt med korrekt UTF-8.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
