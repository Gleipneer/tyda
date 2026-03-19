"""
Reset databasen genom att kora reflektionsarkiv.sql fran scratch.
Ansluter till MySQL UTAN att valja databas (for DROP/CREATE DATABASE).
Hanterar DELIMITER for trigger/procedure.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import mysql.connector
from app.config import settings


def split_sql_statements(content: str) -> list[str]:
    """Dela SQL i satser med hantering av DELIMITER."""
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    lines = content.split("\n")
    statements = []
    current = []
    delim = ";"

    for line in lines:
        stripped = line.strip()

        if stripped.upper().startswith("DELIMITER "):
            if current:
                stmt = "\n".join(current).strip()
                if stmt:
                    statements.append(stmt)
            current = []
            parts = stripped.split(None, 2)
            if len(parts) >= 2:
                delim = parts[1].strip()
            continue

        if delim == ";":
            current.append(line)
            if stripped.endswith(";"):
                stmt = "\n".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []
        else:
            current.append(line)
            if stripped.endswith(delim):
                stmt = "\n".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []

    if current:
        stmt = "\n".join(current).strip()
        if stmt:
            statements.append(stmt)

    return statements


def main():
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sql_path = os.path.join(base, "reflektionsarkiv.sql")

    with open(sql_path, encoding="utf-8") as f:
        content = f.read()

    statements = split_sql_statements(content)

    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
    )

    cursor = conn.cursor()
    try:
        for i, stmt in enumerate(statements):
            stmt = stmt.strip()
            if not stmt:
                continue
            if stmt.rstrip().endswith("//"):
                stmt = stmt.rstrip()[:-2] + ";"
            elif not stmt.rstrip().endswith(";"):
                stmt = stmt.rstrip() + ";"
            try:
                for result in cursor.execute(stmt, multi=True):
                    if result is not None:
                        pass
            except mysql.connector.Error as e:
                print(f"Fel vid sats {i + 1}: {e}")
                raise
            conn.commit()
    finally:
        cursor.close()
        conn.close()

    print("Databas aterstalld fran reflektionsarkiv.sql")


if __name__ == "__main__":
    main()
