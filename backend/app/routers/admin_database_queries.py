"""
Admin: pedagogisk visning av fördefinierade, read-only SQL-frågor.

Ingen fri SQL — endast whitelistade strängar som matchar reflektionsarkiv-schemat.
"""
from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_cursor
from app.deps import require_admin
from app.schemas.admin_database_queries import DatabaseQueryCatalogItem, DatabaseQueryRunResponse

router = APIRouter(dependencies=[Depends(require_admin)])


def _serialize_cell(value: Any) -> Any:
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat(sep=" ", timespec="seconds") if isinstance(value, datetime.datetime) else str(value)
    if isinstance(value, Decimal):
        return float(value)
    return value


def _rows_to_jsonable(rows: list[dict[str, Any]]) -> tuple[list[str], list[dict[str, Any]]]:
    if not rows:
        return [], []
    columns = list(rows[0].keys())
    out: list[dict[str, Any]] = []
    for row in rows:
        out.append({k: _serialize_cell(row[k]) for k in columns})
    return columns, out


# Whitelist: id -> metadata + exakt SQL (SELECT … eller CALL …)
# Alla tabeller/kolumner följer reflektionsarkiv.sql
_PREDEFINED_DATABASE_QUERIES: list[dict[str, Any]] = [
    {
        "id": "where-kategori-drom",
        "title": "WHERE — poster i kategorin «drom»",
        "description": "Filtrerar poster på kategorinamn via koppling till Kategorier.",
        "principle": "WHERE, INNER JOIN",
        "sql": """
SELECT p.PostID, p.Titel, p.Synlighet, p.SkapadDatum
FROM Poster p
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
WHERE k.Namn = 'drom'
ORDER BY p.SkapadDatum DESC
LIMIT 50
""".strip(),
        "kind": "select",
    },
    {
        "id": "where-anvandare-min-id",
        "title": "WHERE — poster för en befintlig användare",
        "description": "Visar poster där AnvandarID matchar minsta id i Anvandare (ingen fri inmatning).",
        "principle": "WHERE, underfråga",
        "sql": """
SELECT p.PostID, p.Titel, p.Synlighet, p.SkapadDatum
FROM Poster p
WHERE p.AnvandarID = (SELECT MIN(a.AnvandarID) FROM Anvandare a)
ORDER BY p.SkapadDatum DESC
LIMIT 30
""".strip(),
        "kind": "select",
    },
    {
        "id": "where-begrepp-orm",
        "title": "WHERE — begreppet «orm»",
        "description": "Hämtar en rad ur Begrepp med exakt match på Ord.",
        "principle": "WHERE",
        "sql": """
SELECT BegreppID, Ord, Beskrivning, SkapadDatum
FROM Begrepp
WHERE Ord = 'orm'
LIMIT 1
""".strip(),
        "kind": "select",
    },
    {
        "id": "order-by-senaste-poster",
        "title": "ORDER BY — senaste poster först",
        "description": "Sorterar poster efter SkapadDatum fallande.",
        "principle": "ORDER BY",
        "sql": """
SELECT PostID, Titel, SkapadDatum
FROM Poster
ORDER BY SkapadDatum DESC
LIMIT 20
""".strip(),
        "kind": "select",
    },
    {
        "id": "join-poster-kategori",
        "title": "INNER JOIN — poster med kategorinamn",
        "description": "Kopplar Poster till Kategorier för att visa läsbar kategori.",
        "principle": "INNER JOIN",
        "sql": """
SELECT p.PostID, p.Titel, k.Namn AS KategoriNamn, p.SkapadDatum
FROM Poster p
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
ORDER BY p.SkapadDatum DESC
LIMIT 25
""".strip(),
        "kind": "select",
    },
    {
        "id": "join-anvandare-med-poster",
        "title": "INNER JOIN — användare som har minst en post",
        "description": "DISTINCT användare som faktiskt skapat poster.",
        "principle": "INNER JOIN, DISTINCT",
        "sql": """
SELECT DISTINCT a.AnvandarID, a.Anvandarnamn
FROM Anvandare a
INNER JOIN Poster p ON a.AnvandarID = p.AnvandarID
ORDER BY a.Anvandarnamn
""".strip(),
        "kind": "select",
    },
    {
        "id": "join-post-begrepp",
        "title": "INNER JOIN — begrepp kopplade till poster",
        "description": "Visar kopplingstabellen PostBegrepp mellan Poster och Begrepp.",
        "principle": "INNER JOIN (många-till-många via PostBegrepp)",
        "sql": """
SELECT p.PostID, p.Titel, b.Ord AS BegreppOrd
FROM Poster p
INNER JOIN PostBegrepp pb ON p.PostID = pb.PostID
INNER JOIN Begrepp b ON pb.BegreppID = b.BegreppID
ORDER BY p.PostID, b.Ord
LIMIT 40
""".strip(),
        "kind": "select",
    },
    {
        "id": "left-join-anvandare-alla",
        "title": "LEFT JOIN — alla användare med postantal",
        "description": "Alla rader i Anvandare; poster som saknas ger 0 i antal.",
        "principle": "LEFT JOIN, GROUP BY",
        "sql": """
SELECT a.AnvandarID, a.Anvandarnamn, COUNT(p.PostID) AS AntalPoster
FROM Anvandare a
LEFT JOIN Poster p ON a.AnvandarID = p.AnvandarID
GROUP BY a.AnvandarID, a.Anvandarnamn
ORDER BY a.AnvandarID
""".strip(),
        "kind": "select",
    },
    {
        "id": "left-join-begrepp-kopplingar",
        "title": "LEFT JOIN — begrepp och antal kopplingar",
        "description": "Räknar PostBegrepp per begrepp; begrepp utan koppling får 0.",
        "principle": "LEFT JOIN, GROUP BY, COUNT",
        "sql": """
SELECT b.BegreppID, b.Ord, COUNT(pb.PostBegreppID) AS AntalKopplingar
FROM Begrepp b
LEFT JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
GROUP BY b.BegreppID, b.Ord
ORDER BY AntalKopplingar DESC, b.Ord
""".strip(),
        "kind": "select",
    },
    {
        "id": "group-by-poster-per-anvandare",
        "title": "GROUP BY — antal poster per användare",
        "description": "Aggregerar poster per skapare.",
        "principle": "GROUP BY, COUNT",
        "sql": """
SELECT a.Anvandarnamn, COUNT(p.PostID) AS AntalPoster
FROM Anvandare a
INNER JOIN Poster p ON a.AnvandarID = p.AnvandarID
GROUP BY a.AnvandarID, a.Anvandarnamn
ORDER BY AntalPoster DESC
""".strip(),
        "kind": "select",
    },
    {
        "id": "having-fler-an-an-post",
        "title": "HAVING — användare med mer än en post",
        "description": "Filtrerar grupper efter COUNT — klassiskt HAVING-exempel.",
        "principle": "GROUP BY, HAVING",
        "sql": """
SELECT a.Anvandarnamn, COUNT(p.PostID) AS AntalPoster
FROM Anvandare a
INNER JOIN Poster p ON a.AnvandarID = p.AnvandarID
GROUP BY a.AnvandarID, a.Anvandarnamn
HAVING COUNT(p.PostID) > 1
ORDER BY AntalPoster DESC
""".strip(),
        "kind": "select",
    },
    {
        "id": "having-begrepp-minst-tva",
        "title": "HAVING — begrepp som kopplats minst två gånger",
        "description": "Visar begrepp som förekommer i PostBegrepp minst två gånger.",
        "principle": "GROUP BY, HAVING",
        "sql": """
SELECT b.Ord, COUNT(pb.PostBegreppID) AS Kopplingar
FROM Begrepp b
INNER JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
GROUP BY b.BegreppID, b.Ord
HAVING COUNT(pb.PostBegreppID) >= 2
ORDER BY Kopplingar DESC
""".strip(),
        "kind": "select",
    },
    {
        "id": "proc-hamta-poster-per-kategori",
        "title": "Lagrad procedur — hamta_poster_per_kategori",
        "description": "Anropar proceduren från reflektionsarkiv.sql med ett fast datumintervall (samma idé som i SQL-filen).",
        "principle": "CALL, GROUP BY (i proceduren)",
        "sql": "CALL hamta_poster_per_kategori('2024-01-01', '2026-12-31')",
        "kind": "call",
    },
]


def _get_query_or_404(query_id: str) -> dict[str, Any]:
    for q in _PREDEFINED_DATABASE_QUERIES:
        if q["id"] == query_id:
            return q
    raise HTTPException(status_code=404, detail="Okänd query-id")


@router.get("/admin/database-queries", response_model=list[DatabaseQueryCatalogItem])
def list_database_queries():
    """Lista alla fördefinierade frågor (metadata + SQL-text)."""
    return [
        DatabaseQueryCatalogItem(
            id=q["id"],
            title=q["title"],
            description=q["description"],
            principle=q["principle"],
            sql_text=q["sql"],
        )
        for q in _PREDEFINED_DATABASE_QUERIES
    ]


@router.post("/admin/database-queries/{query_id}/run", response_model=DatabaseQueryRunResponse)
def run_database_query(query_id: str):
    """Kör en whitelistad read-only fråga och returnerar kolumner + rader."""
    q = _get_query_or_404(query_id)
    sql = q["sql"]
    kind = q["kind"]

    with get_cursor() as cursor:
        if kind == "select":
            cursor.execute(sql)
            raw = cursor.fetchall() or []
        elif kind == "call":
            cursor.execute(sql)
            raw = cursor.fetchall() or []
        else:
            raise HTTPException(status_code=500, detail="Ogiltig query-typ")

    columns, rows = _rows_to_jsonable(raw)
    return DatabaseQueryRunResponse(
        query_id=q["id"],
        title=q["title"],
        sql_executed=sql,
        columns=columns,
        rows=rows,
        row_count=len(rows),
        kind=kind,  # type: ignore[arg-type]
    )
