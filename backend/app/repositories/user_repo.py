"""Repository för Anvandare-tabellen."""
from app.db import get_cursor


def get_user_by_id(user_id: int):
    """Hämtar en användare på ID. Returnerar None om inte finns."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT AnvandarID, Anvandarnamn, Epost, SkapadDatum, ArAdmin
            FROM Anvandare
            WHERE AnvandarID = %s
            """,
            (user_id,),
        )
        return cursor.fetchone()


def get_user_with_hash_by_identifier(identifier: str):
    """
    Hämtar användare inkl. LosenordHash för inloggning.
    Om identifier är exakt 'admin' (skiftlägesokänslig): välj konto med ArAdmin=1.
    Annars matcha Epost (skiftlägesokänslig).
    """
    key = identifier.strip()
    if not key:
        return None
    with get_cursor() as cursor:
        if key.lower() == "admin":
            cursor.execute(
                """
                SELECT AnvandarID, Anvandarnamn, Epost, SkapadDatum, ArAdmin, LosenordHash
                FROM Anvandare
                WHERE ArAdmin = 1
                ORDER BY AnvandarID
                LIMIT 1
                """
            )
        else:
            cursor.execute(
                """
                SELECT AnvandarID, Anvandarnamn, Epost, SkapadDatum, ArAdmin, LosenordHash
                FROM Anvandare
                WHERE LOWER(Epost) = LOWER(%s)
                """,
                (key,),
            )
        return cursor.fetchone()


def create_user(anvandarnamn: str, epost: str, losenord_hash: str, ar_admin: int = 0) -> int:
    """Skapar ny användare. ar_admin ska vara 0 eller 1. Returnerar AnvandarID."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO Anvandare (Anvandarnamn, Epost, LosenordHash, ArAdmin)
            VALUES (%s, %s, %s, %s)
            """,
            (anvandarnamn, epost, losenord_hash, 1 if ar_admin else 0),
        )
        return cursor.lastrowid


def list_all_users():
    """Alla användare för admin (utan lösenord)."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT AnvandarID, Anvandarnamn, Epost, SkapadDatum, ArAdmin
            FROM Anvandare
            ORDER BY AnvandarID ASC
            """
        )
        return cursor.fetchall()


def count_users() -> int:
    with get_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS c FROM Anvandare")
        return int(cursor.fetchone()["c"])
