"""Repository för Begrepp och PostBegrepp."""
from app.db import get_cursor


def get_all_concepts():
    """Hämtar alla begrepp."""
    with get_cursor() as cursor:
        cursor.execute("SELECT BegreppID, Ord, Beskrivning FROM Begrepp ORDER BY Ord ASC")
        return cursor.fetchall()


def get_concept_by_id(concept_id: int):
    """Hämtar ett begrepp."""
    with get_cursor() as cursor:
        cursor.execute("SELECT BegreppID, Ord, Beskrivning FROM Begrepp WHERE BegreppID = %s", (concept_id,))
        return cursor.fetchone()


def create_concept(ord: str, beskrivning: str) -> int:
    """Skapar begrepp. Returnerar BegreppID."""
    with get_cursor() as cursor:
        cursor.execute("INSERT INTO Begrepp (Ord, Beskrivning) VALUES (%s, %s)", (ord, beskrivning))
        return cursor.lastrowid


def update_concept(concept_id: int, ord: str, beskrivning: str) -> int:
    """Uppdaterar begrepp."""
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE Begrepp SET Ord = %s, Beskrivning = %s WHERE BegreppID = %s",
            (ord, beskrivning, concept_id),
        )
        return cursor.rowcount


def delete_concept(concept_id: int) -> int:
    """Tar bort begrepp. Kopplingar i PostBegrepp rensas via ON DELETE CASCADE."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM Begrepp WHERE BegreppID = %s", (concept_id,))
        return cursor.rowcount


def get_concepts_by_post_id(post_id: int):
    """Hämtar begrepp kopplade till en post."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT pb.PostBegreppID,
                   b.BegreppID, b.Ord, b.Beskrivning
            FROM PostBegrepp pb
            INNER JOIN Begrepp b ON pb.BegreppID = b.BegreppID
            WHERE pb.PostID = %s
            ORDER BY b.Ord ASC
            """,
            (post_id,),
        )
        rows = cursor.fetchall()
        return [
            {
                "post_begrepp_id": r["PostBegreppID"],
                "begrepp": {
                    "begrepp_id": r["BegreppID"],
                    "ord": r["Ord"],
                    "beskrivning": r["Beskrivning"],
                },
            }
            for r in rows
        ]


def link_concept_to_post(post_id: int, begrepp_id: int) -> int:
    """Kopplar begrepp till post. Returnerar PostBegreppID."""
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO PostBegrepp (PostID, BegreppID) VALUES (%s, %s)",
            (post_id, begrepp_id),
        )
        return cursor.lastrowid


def delete_post_concept(post_begrepp_id: int) -> int:
    """Tar bort koppling mellan post och begrepp."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM PostBegrepp WHERE PostBegreppID = %s", (post_begrepp_id,))
        return cursor.rowcount


def get_post_owner_for_post_begrepp(post_begrepp_id: int) -> int | None:
    """Returnerar Poster.AnvandarID för en PostBegrepp-rad, eller None."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT p.AnvandarID
            FROM PostBegrepp pb
            INNER JOIN Poster p ON p.PostID = pb.PostID
            WHERE pb.PostBegreppID = %s
            """,
            (post_begrepp_id,),
        )
        row = cursor.fetchone()
        return int(row["AnvandarID"]) if row else None
