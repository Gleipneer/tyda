"""Repository för AktivitetLogg-tabellen."""
from app.db import get_cursor


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


def get_activity_for_anvandares_poster(anvandar_id: int):
    """Loggrader där posten tillhör angiven användare."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT al.LoggID, al.PostID, al.AnvandarID, al.Handelse, al.Tidpunkt
            FROM AktivitetLogg al
            INNER JOIN Poster p ON al.PostID = p.PostID
            WHERE p.AnvandarID = %s
            ORDER BY al.Tidpunkt DESC, al.LoggID DESC
            """,
            (anvandar_id,),
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
