"""
Databasanslutning för Reflektionsarkiv.
Använder mysql-connector-python med dictionary cursor för enkel mappning.
"""
import mysql.connector
from mysql.connector import Error
from contextlib import contextmanager

from app.config import settings


def get_connection():
    """
    Skapar en ny databasanslutning.
    Returnerar connection-objekt eller kastar vid fel.
    """
    try:
        conn = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
        )
        return conn
    except Error as e:
        raise RuntimeError(f"Databasanslutning misslyckades: {e}") from e


@contextmanager
def get_cursor(dictionary: bool = True):
    """
    Context manager för att hämta en cursor.
    dictionary=True ger rader som dict istället för tuple.
    Stänger cursor och connection vid slut.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def check_db_connection() -> bool:
    """
    Kontrollerar om backend kan prata med databasen.
    Returnerar True om SELECT 1 lyckas.
    """
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT 1 AS ok")
            row = cursor.fetchone()
            return row is not None and row.get("ok") == 1
    except Exception:
        return False
