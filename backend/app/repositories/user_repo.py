"""Repository för Anvandare-tabellen."""
from app.db import get_cursor


def get_all_users():
    """Hämtar alla användare sorterade på ID."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT AnvandarID, Anvandarnamn, Epost, SkapadDatum
            FROM Anvandare
            ORDER BY AnvandarID
            """
        )
        return cursor.fetchall()


def get_user_by_id(user_id: int):
    """Hämtar en användare på ID. Returnerar None om inte finns."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT AnvandarID, Anvandarnamn, Epost, SkapadDatum FROM Anvandare WHERE AnvandarID = %s",
            (user_id,),
        )
        return cursor.fetchone()


def create_user(anvandarnamn: str, epost: str) -> int:
    """Skapar ny användare. Returnerar AnvandarID."""
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO Anvandare (Anvandarnamn, Epost) VALUES (%s, %s)",
            (anvandarnamn, epost),
        )
        return cursor.lastrowid
