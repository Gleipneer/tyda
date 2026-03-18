"""Repository för Poster-tabellen."""
from app.db import get_cursor


def _row_to_post_item(row: dict) -> dict:
    """Mappar databasrad till API-format."""
    return {
        "post_id": row["PostID"],
        "titel": row["Titel"],
        "innehall": row["Innehall"],
        "synlighet": row["Synlighet"],
        "skapad_datum": row["SkapadDatum"],
        "anvandar": {
            "anvandar_id": row["AnvandarID"],
            "anvandarnamn": row["Anvandarnamn"],
        },
        "kategori": {
            "kategori_id": row["KategoriID"],
            "namn": row["KategoriNamn"],
        },
    }


def get_all_posts(anvandar_id: int | None = None, synlighet: str | None = None):
    """Hämtar poster med valfri filtrering."""
    with get_cursor() as cursor:
        where = []
        params = []
        if anvandar_id is not None:
            where.append("p.AnvandarID = %s")
            params.append(anvandar_id)
        if synlighet is not None:
            where.append("p.Synlighet = %s")
            params.append(synlighet)

        sql = """
            SELECT
                p.PostID, p.Titel, p.Innehall, p.Synlighet, p.SkapadDatum,
                a.AnvandarID, a.Anvandarnamn,
                k.KategoriID, k.Namn AS KategoriNamn
            FROM Poster p
            INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
            INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY p.SkapadDatum DESC, p.PostID DESC"
        cursor.execute(sql, tuple(params))
        return [_row_to_post_item(r) for r in cursor.fetchall()]


def get_public_posts():
    """Hämtar bara offentliga poster."""
    return get_all_posts(synlighet="publik")


def get_post_by_id(post_id: int):
    """Hämtar en post på ID. Returnerar None om inte finns."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                p.PostID, p.Titel, p.Innehall, p.Synlighet, p.SkapadDatum,
                a.AnvandarID, a.Anvandarnamn,
                k.KategoriID, k.Namn AS KategoriNamn
            FROM Poster p
            INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
            INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
            WHERE p.PostID = %s
            """,
            (post_id,),
        )
        row = cursor.fetchone()
        return _row_to_post_item(row) if row else None


def get_public_post_by_id(post_id: int):
    """Hämtar en offentlig post på ID."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                p.PostID, p.Titel, p.Innehall, p.Synlighet, p.SkapadDatum,
                a.AnvandarID, a.Anvandarnamn,
                k.KategoriID, k.Namn AS KategoriNamn
            FROM Poster p
            INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
            INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
            WHERE p.PostID = %s AND p.Synlighet = 'publik'
            """,
            (post_id,),
        )
        row = cursor.fetchone()
        return _row_to_post_item(row) if row else None


def create_post(anvandar_id: int, kategori_id: int, titel: str, innehall: str, synlighet: str) -> int:
    """Skapar ny post. Trigger skapar AktivitetLogg. Returnerar PostID."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO Poster (AnvandarID, KategoriID, Titel, Innehall, Synlighet)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (anvandar_id, kategori_id, titel, innehall, synlighet),
        )
        return cursor.lastrowid


def update_post(post_id: int, titel: str | None, innehall: str | None, synlighet: str | None, kategori_id: int | None) -> int:
    """Uppdaterar post. Returnerar antal påverkade rader."""
    with get_cursor() as cursor:
        # Bygg dynamisk UPDATE
        updates = []
        params = []
        if titel is not None:
            updates.append("Titel = %s")
            params.append(titel)
        if innehall is not None:
            updates.append("Innehall = %s")
            params.append(innehall)
        if synlighet is not None:
            updates.append("Synlighet = %s")
            params.append(synlighet)
        if kategori_id is not None:
            updates.append("KategoriID = %s")
            params.append(kategori_id)
        if not updates:
            return 0
        params.append(post_id)
        cursor.execute(
            f"UPDATE Poster SET {', '.join(updates)} WHERE PostID = %s",
            params,
        )
        return cursor.rowcount


def delete_post(post_id: int) -> int:
    """Tar bort post. Barnrader i logg och kopplingar rensas via ON DELETE CASCADE."""
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM Poster WHERE PostID = %s", (post_id,))
        return cursor.rowcount
