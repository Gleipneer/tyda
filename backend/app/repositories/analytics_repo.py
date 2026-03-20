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


def get_posts_per_category_for_user(anvandar_id: int):
    """Poster per kategori för en användare."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT k.KategoriID, k.Namn AS Kategori, COUNT(p.PostID) AS AntalPoster
            FROM Kategorier k
            LEFT JOIN Poster p ON k.KategoriID = p.KategoriID AND p.AnvandarID = %s
            GROUP BY k.KategoriID, k.Namn
            ORDER BY AntalPoster DESC, k.Namn ASC
            """,
            (anvandar_id,),
        )
        return [{"kategori_id": r["KategoriID"], "kategori": r["Kategori"], "antal_poster": r["AntalPoster"]} for r in cursor.fetchall()]


def get_posts_per_user_self(anvandar_id: int):
    """En rad: vald användares antal poster."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT a.AnvandarID, a.Anvandarnamn, COUNT(p.PostID) AS AntalPoster
            FROM Anvandare a
            LEFT JOIN Poster p ON a.AnvandarID = p.AnvandarID
            WHERE a.AnvandarID = %s
            GROUP BY a.AnvandarID, a.Anvandarnamn
            """,
            (anvandar_id,),
        )
        row = cursor.fetchone()
        if not row:
            return []
        return [{"anvandar_id": row["AnvandarID"], "anvandarnamn": row["Anvandarnamn"], "antal_poster": row["AntalPoster"]}]


def get_most_used_concepts_for_user(anvandar_id: int):
    """Begrepp kopplade till användarens poster (via PostBegrepp)."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT b.BegreppID, b.Ord, COUNT(pb.PostBegreppID) AS AntalKopplingar
            FROM Begrepp b
            INNER JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
            INNER JOIN Poster p ON pb.PostID = p.PostID
            WHERE p.AnvandarID = %s
            GROUP BY b.BegreppID, b.Ord
            ORDER BY AntalKopplingar DESC, b.Ord ASC
            """,
            (anvandar_id,),
        )
        return [{"begrepp_id": r["BegreppID"], "ord": r["Ord"], "antal_kopplingar": r["AntalKopplingar"]} for r in cursor.fetchall()]
