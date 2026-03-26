"""Repository för AktivitetLogg-tabellen."""
from app.db import get_cursor


def get_activity_for_post_owner(owner_anvandar_id: int):
    """Aktivitet för poster som ägs av given användare (trigger-logg kopplad via PostID)."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT a.LoggID, a.PostID, a.AnvandarID, a.Handelse, a.Tidpunkt
            FROM AktivitetLogg a
            INNER JOIN Poster p ON p.PostID = a.PostID
            WHERE p.AnvandarID = %s
            ORDER BY a.Tidpunkt DESC, a.LoggID DESC
            """,
            (owner_anvandar_id,),
        )
        return [
            {
                "logg_id": r["LoggID"],
                "post_id": r["PostID"],
                "anvandar_id": r["AnvandarID"],
                "handelse": r["Handelse"],
                "tidpunkt": r["Tidpunkt"],
            }
            for r in cursor.fetchall()
        ]


def get_all_activity():
    """Hämtar hela aktivitetsloggen."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT LoggID, PostID, AnvandarID, Handelse, Tidpunkt FROM AktivitetLogg ORDER BY Tidpunkt DESC, LoggID DESC"
        )
        return [
            {
                "logg_id": r["LoggID"],
                "post_id": r["PostID"],
                "anvandar_id": r["AnvandarID"],
                "handelse": r["Handelse"],
                "tidpunkt": r["Tidpunkt"],
            }
            for r in cursor.fetchall()
        ]


def get_activity_by_post_id(post_id: int):
    """Hämtar aktivitet för en post."""
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT LoggID, PostID, AnvandarID, Handelse, Tidpunkt FROM AktivitetLogg WHERE PostID = %s ORDER BY Tidpunkt DESC",
            (post_id,),
        )
        return [
            {
                "logg_id": r["LoggID"],
                "post_id": r["PostID"],
                "anvandar_id": r["AnvandarID"],
                "handelse": r["Handelse"],
                "tidpunkt": r["Tidpunkt"],
            }
            for r in cursor.fetchall()
        ]
