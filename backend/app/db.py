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


def get_mysql_connection_identity() -> dict[str, str] | None:
    """
    Vilket MySQL-konto den anslutna sessionen kör som (för visning/diagnostik).
    Rättigheter för det kontot sätts i database/scripts/grants.sql (GRANT/REVOKE).
    """
    try:
        with get_cursor() as cursor:
            cursor.execute("SELECT CURRENT_USER() AS current_user, USER() AS session_user")
            row = cursor.fetchone()
            if not row:
                return None
            cu = row.get("current_user")
            su = row.get("session_user")
            if cu is None and su is None:
                return None
            return {
                "current_user": str(cu) if cu is not None else "",
                "session_user": str(su) if su is not None else "",
            }
    except Exception:
        return None
