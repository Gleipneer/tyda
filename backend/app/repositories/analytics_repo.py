"""Repository för analytics-frågor."""
from app.db import get_cursor


def get_posts_per_category():
    """Antal poster per kategori."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT k.KategoriID, k.Namn AS Kategori, COUNT(p.PostID) AS AntalPoster
            FROM Kategorier k
            LEFT JOIN Poster p ON k.KategoriID = p.KategoriID
            GROUP BY k.KategoriID, k.Namn
            ORDER BY AntalPoster DESC, k.Namn ASC
            """
        )
        return [{"kategori_id": r["KategoriID"], "kategori": r["Kategori"], "antal_poster": r["AntalPoster"]} for r in cursor.fetchall()]


def get_posts_per_user():
    """Antal poster per användare."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT a.AnvandarID, a.Anvandarnamn, COUNT(p.PostID) AS AntalPoster
            FROM Anvandare a
            LEFT JOIN Poster p ON a.AnvandarID = p.AnvandarID
            GROUP BY a.AnvandarID, a.Anvandarnamn
            ORDER BY AntalPoster DESC, a.Anvandarnamn ASC
            """
        )
        return [{"anvandar_id": r["AnvandarID"], "anvandarnamn": r["Anvandarnamn"], "antal_poster": r["AntalPoster"]} for r in cursor.fetchall()]


def get_most_used_concepts():
    """Mest använda begrepp."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT b.BegreppID, b.Ord, COUNT(pb.PostBegreppID) AS AntalKopplingar
            FROM Begrepp b
            LEFT JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
            GROUP BY b.BegreppID, b.Ord
            ORDER BY AntalKopplingar DESC, b.Ord ASC
            """
        )
        return [{"begrepp_id": r["BegreppID"], "ord": r["Ord"], "antal_kopplingar": r["AntalKopplingar"]} for r in cursor.fetchall()]
