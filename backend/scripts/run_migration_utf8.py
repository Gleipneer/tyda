"""
Kör migration med korrekt UTF-8.
Root cause: mysql CLI på Windows använder cp850, vilket korrupterar åäö vid pipning.
Lösning: Kör SQL via mysql-connector-python med charset=utf8mb4.
"""
import os
import sys

# Lägg till app i path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mysql.connector
from app.config import settings


def run_migration_file(conn, path: str) -> None:
    """Läs och kör SQL-fil som UTF-8."""
    with open(path, encoding="utf-8") as f:
        sql = f.read()
    sql = sql.replace("USE reflektionsarkiv;\n", "").replace("USE reflektionsarkiv;\r\n", "")
    cursor = conn.cursor()
    try:
        for result in cursor.execute(sql, multi=True):
            if result is not None:
                pass  # Consume SELECT results if any
    except Exception as e:
        print("Fel:", str(e)[:200])
        raise
    cursor.close()
    conn.commit()


def _split_sql(sql: str) -> list[str]:
    """Dela SQL i satser (enkel implementation)."""
    parts = []
    current = []
    in_str = False
    q = None
    i = 0
    while i < len(sql):
        c = sql[i]
        if not in_str:
            if c in ("'", '"'):
                in_str = True
                q = c
                current.append(c)
            elif c == ";":
                s = "".join(current).strip()
                if s and not s.startswith("--"):
                    parts.append(s)
                current = []
            else:
                current.append(c)
        else:
            if c == "\\" and i + 1 < len(sql):
                current.append(c)
                current.append(sql[i + 1])
                i += 1
            elif c == q:
                in_str = False
                current.append(c)
            else:
                current.append(c)
        i += 1
    if current:
        s = "".join(current).strip()
        if s and not s.startswith("--"):
            parts.append(s)
    return parts


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
        for name in [
            "001_expand_begrepp.sql",
            "002_enrich_begrepp.sql",
            "003_lexicon_250.sql",
            "004_add_kansla.sql",
            "005_drop_kommentarer.sql",
            "006_lexicon_extended.sql",
            "007_lexicon_dromtolkning.sql",
            "008_precision_dromtolkning.sql",
            "009_database_truth_consolidation.sql",
        ]:
            path = os.path.join(migrations_dir, name)
            if os.path.exists(path):
                print("Kör", name, "...")
                run_migration_file(conn, path)
                print("  OK")
            else:
                print(f"Hoppar över {name} (finns inte)")
    finally:
        conn.close()
    print("Klart.")


if __name__ == "__main__":
    main()
