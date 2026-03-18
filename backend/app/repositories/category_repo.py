"""Repository för Kategorier-tabellen."""
from app.db import get_cursor


def get_all_categories():
    """Hämtar alla kategorier sorterade på namn."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT KategoriID, Namn, Beskrivning
            FROM Kategorier
            ORDER BY Namn
            """
        )
        return cursor.fetchall()


def get_category_by_id(category_id: int):
    """Hämtar en kategori på ID. Returnerar None om inte finns."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT KategoriID, Namn, Beskrivning FROM Kategorier WHERE KategoriID = %s",
            (category_id,),
        )
        return cursor.fetchone()
