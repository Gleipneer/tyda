"""Repository för Anvandare-tabellen."""
from app.db import get_cursor


def is_admin(user_id: int) -> bool:
    """True om användaren har ArAdmin=1 i databasen."""
    row = get_user_by_id(user_id)
    return bool(row and int(row.get("ArAdmin") or 0))


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


def create_user(anvandarnamn: str, epost: str, losenord_hash: str) -> int:
    """Skapar ny användare (icke-admin). Returnerar AnvandarID."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO Anvandare (Anvandarnamn, Epost, LosenordHash, ArAdmin)
            VALUES (%s, %s, %s, 0)
            """,
            (anvandarnamn, epost, losenord_hash),
        )
        return cursor.lastrowid
