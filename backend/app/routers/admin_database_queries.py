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


def _fetch_call_rows(cursor: Any, sql: str) -> list[dict[str, Any]]:
    """
    MySQL CALL kan lämna kvar extra result sets/statuspaket.
    De måste konsumeras innan connection commit/rollback i get_cursor().
    """
    cursor.execute(sql)
    rows = cursor.fetchall() or []
    while True:
        try:
            has_next = cursor.nextset()
        except Exception:
            break
        if not has_next:
            break
        try:
            cursor.fetchall()
        except Exception:
            break
    return rows


# Whitelist: id -> metadata + exakt SQL (SELECT … eller CALL …)
# Alla tabeller/kolumner följer reflektionsarkiv.sql
_PREDEFINED_DATABASE_QUERIES: list[dict[str, Any]] = [
    {
        "id": "alla-anvandare",
        "title": "Alla användare",
        "description": "Visar samtliga användare med adminflagga och skapadatum.",
        "principle": "SELECT, ORDER BY",
        "sql": """
SELECT
    AnvandarID,
    Anvandarnamn,
    Epost,
    ArAdmin,
    SkapadDatum
FROM Anvandare
ORDER BY SkapadDatum DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "alla-kategorier",
        "title": "Alla kategorier",
        "description": "Visar de kategorier som finns i systemet.",
        "principle": "SELECT, ORDER BY",
        "sql": """
SELECT
    KategoriID,
    Namn,
    Beskrivning
FROM Kategorier
ORDER BY Namn;
""".strip(),
        "kind": "select",
    },
    {
        "id": "alla-begrepp",
        "title": "Alla begrepp",
        "description": "Visar begreppslexikonet med beskrivningar och skapadatum.",
        "principle": "SELECT, ORDER BY",
        "sql": """
SELECT
    BegreppID,
    Ord,
    Beskrivning,
    SkapadDatum
FROM Begrepp
ORDER BY Ord;
""".strip(),
        "kind": "select",
    },
    {
        "id": "alla-poster-senaste-forst",
        "title": "Alla poster sorterade senaste först",
        "description": "Visar postöversikt sorterad efter senaste datum.",
        "principle": "SELECT, ORDER BY",
        "sql": """
SELECT
    PostID,
    AnvandarID,
    KategoriID,
    Titel,
    Synlighet,
    SkapadDatum
FROM Poster
ORDER BY SkapadDatum DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "poster-med-anvandare-och-kategori",
        "title": "Poster med användare och kategori",
        "description": "Visar hur Poster kopplas till både Anvandare och Kategorier.",
        "principle": "INNER JOIN, ORDER BY",
        "sql": """
SELECT
    Poster.PostID,
    Poster.Titel,
    Anvandare.Anvandarnamn,
    Kategorier.Namn AS Kategori,
    Poster.Synlighet,
    Poster.SkapadDatum
FROM Poster
INNER JOIN Anvandare ON Poster.AnvandarID = Anvandare.AnvandarID
INNER JOIN Kategorier ON Poster.KategoriID = Kategorier.KategoriID
ORDER BY Poster.SkapadDatum DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "begrepp-per-post",
        "title": "Begrepp per post",
        "description": "Visar många-till-många-relationen via PostBegrepp.",
        "principle": "INNER JOIN, många-till-många",
        "sql": """
SELECT
    PostBegrepp.PostID,
    Poster.Titel,
    Begrepp.Ord
FROM PostBegrepp
JOIN Poster ON PostBegrepp.PostID = Poster.PostID
JOIN Begrepp ON PostBegrepp.BegreppID = Begrepp.BegreppID
ORDER BY PostBegrepp.PostID, Begrepp.Ord;
""".strip(),
        "kind": "select",
    },
    {
        "id": "alla-anvandare-aven-utan-poster",
        "title": "Alla användare även utan poster",
        "description": "LEFT JOIN som visar att användare kan listas även om de saknar poster.",
        "principle": "LEFT JOIN, ORDER BY",
        "sql": """
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    Poster.PostID,
    Poster.Titel
FROM Anvandare
LEFT JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID
ORDER BY Anvandare.AnvandarID, Poster.PostID;
""".strip(),
        "kind": "select",
    },
    {
        "id": "antal-poster-per-anvandare",
        "title": "Antal poster per användare",
        "description": "Räknar antal poster per användare, inklusive användare utan poster.",
        "principle": "LEFT JOIN, GROUP BY, COUNT",
        "sql": """
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    COUNT(Poster.PostID) AS AntalPoster
FROM Anvandare
LEFT JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID
GROUP BY Anvandare.AnvandarID, Anvandare.Anvandarnamn
ORDER BY AntalPoster DESC, Anvandare.Anvandarnamn;
""".strip(),
        "kind": "select",
    },
    {
        "id": "antal-poster-per-kategori",
        "title": "Antal poster per kategori",
        "description": "Visar hur många poster som finns i varje kategori.",
        "principle": "LEFT JOIN, GROUP BY, COUNT",
        "sql": """
SELECT
    Kategorier.KategoriID,
    Kategorier.Namn,
    COUNT(Poster.PostID) AS AntalPoster
FROM Kategorier
LEFT JOIN Poster ON Kategorier.KategoriID = Poster.KategoriID
GROUP BY Kategorier.KategoriID, Kategorier.Namn
ORDER BY AntalPoster DESC, Kategorier.Namn;
""".strip(),
        "kind": "select",
    },
    {
        "id": "mest-anvanda-begrepp",
        "title": "Mest använda begrepp",
        "description": "Räknar hur många gånger varje begrepp har kopplats till en post.",
        "principle": "LEFT JOIN, GROUP BY, COUNT",
        "sql": """
SELECT
    Begrepp.BegreppID,
    Begrepp.Ord,
    COUNT(PostBegrepp.PostBegreppID) AS AntalKopplingar
FROM Begrepp
LEFT JOIN PostBegrepp ON Begrepp.BegreppID = PostBegrepp.BegreppID
GROUP BY Begrepp.BegreppID, Begrepp.Ord
ORDER BY AntalKopplingar DESC, Begrepp.Ord;
""".strip(),
        "kind": "select",
    },
    {
        "id": "anvandare-med-fler-an-en-post",
        "title": "Användare med fler än en post",
        "description": "HAVING-exempel som filtrerar grupper efter COUNT.",
        "principle": "LEFT JOIN, GROUP BY, HAVING",
        "sql": """
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    COUNT(Poster.PostID) AS AntalPoster
FROM Anvandare
LEFT JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID
GROUP BY Anvandare.AnvandarID, Anvandare.Anvandarnamn
HAVING COUNT(Poster.PostID) > 1
ORDER BY AntalPoster DESC, Anvandare.Anvandarnamn;
""".strip(),
        "kind": "select",
    },
    {
        "id": "poster-med-anvandare-kategori-och-begrepp",
        "title": "Poster med användare, kategori och begrepp",
        "description": "Kombinerar flera tabeller och visar även poster utan kopplade begrepp.",
        "principle": "INNER JOIN, LEFT JOIN, ORDER BY",
        "sql": """
SELECT
    Poster.PostID,
    Poster.Titel,
    Anvandare.Anvandarnamn,
    Kategorier.Namn AS Kategori,
    Begrepp.Ord
FROM Poster
INNER JOIN Anvandare ON Poster.AnvandarID = Anvandare.AnvandarID
INNER JOIN Kategorier ON Poster.KategoriID = Kategorier.KategoriID
LEFT JOIN PostBegrepp ON Poster.PostID = PostBegrepp.PostID
LEFT JOIN Begrepp ON PostBegrepp.BegreppID = Begrepp.BegreppID
ORDER BY Poster.PostID, Begrepp.Ord;
""".strip(),
        "kind": "select",
    },
    {
        "id": "aktivitetslogg",
        "title": "Aktivitetslogg",
        "description": "Visar databasen aktivitetshistorik från triggerstyrd loggning.",
        "principle": "SELECT, ORDER BY",
        "sql": """
SELECT
    AktivitetLogg.LoggID,
    AktivitetLogg.PostID,
    AktivitetLogg.AnvandarID,
    AktivitetLogg.Handelse,
    AktivitetLogg.Tidpunkt
FROM AktivitetLogg
ORDER BY AktivitetLogg.Tidpunkt DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "poster-utan-kopplade-begrepp",
        "title": "Poster utan kopplade begrepp",
        "description": "WHERE + LEFT JOIN för att hitta poster som ännu saknar rad i PostBegrepp.",
        "principle": "LEFT JOIN, WHERE, ORDER BY",
        "sql": """
SELECT
    Poster.PostID,
    Poster.Titel,
    Poster.Synlighet,
    Poster.SkapadDatum
FROM Poster
LEFT JOIN PostBegrepp ON Poster.PostID = PostBegrepp.PostID
WHERE PostBegrepp.PostID IS NULL
ORDER BY Poster.SkapadDatum DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "publika-poster",
        "title": "Publika poster",
        "description": "WHERE-fråga som visar alla publika poster.",
        "principle": "WHERE, ORDER BY",
        "sql": """
SELECT
    PostID,
    Titel,
    Synlighet,
    SkapadDatum
FROM Poster
WHERE Synlighet = 'publik'
ORDER BY SkapadDatum DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "privata-poster",
        "title": "Privata poster",
        "description": "WHERE-fråga som visar alla privata poster.",
        "principle": "WHERE, ORDER BY",
        "sql": """
SELECT
    PostID,
    Titel,
    Synlighet,
    SkapadDatum
FROM Poster
WHERE Synlighet = 'privat'
ORDER BY SkapadDatum DESC;
""".strip(),
        "kind": "select",
    },
    {
        "id": "rapport-poster-per-kategori",
        "title": "Rapport per kategori (stored procedure)",
        "description": "Anropar lagrad procedur `hamta_poster_per_kategori` för ett bestämt datumintervall.",
        "principle": "CALL, GROUP BY",
        "sql": "CALL hamta_poster_per_kategori('2024-01-01', '2026-12-31');",
        "kind": "call",
    },
]


def _get_query_or_404(query_id: str) -> dict[str, Any]:
    for q in _PREDEFINED_DATABASE_QUERIES:
        if q["id"] == query_id:
            return q
    raise HTTPException(status_code=404, detail="Okänd query-id")


def _catalog_items() -> list[DatabaseQueryCatalogItem]:
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


def _execute_whitelisted_query(query_id: str) -> DatabaseQueryRunResponse:
    q = _get_query_or_404(query_id)
    sql = q["sql"]
    kind = q["kind"]

    with get_cursor() as cursor:
        if kind == "select":
            cursor.execute(sql)
            raw = cursor.fetchall() or []
        elif kind == "call":
            raw = _fetch_call_rows(cursor, sql)
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


@router.get("/admin/db-queries", response_model=list[DatabaseQueryCatalogItem])
def list_database_queries():
    """Lista alla fördefinierade frågor (metadata + SQL-text)."""
    return _catalog_items()


@router.get("/admin/database-queries", response_model=list[DatabaseQueryCatalogItem], include_in_schema=False)
def list_database_queries_alias():
    return _catalog_items()


@router.get("/admin/vg-queries", response_model=list[DatabaseQueryCatalogItem], include_in_schema=False)
def list_database_queries_legacy_alias():
    """Bakåtkompatibel sökväg (samma svar som /admin/database-queries)."""
    return _catalog_items()


@router.post("/admin/db-queries/{query_id}/run", response_model=DatabaseQueryRunResponse)
def run_database_query(query_id: str):
    """Kör en whitelistad read-only fråga och returnerar kolumner + rader."""
    return _execute_whitelisted_query(query_id)


@router.post("/admin/database-queries/{query_id}/run", response_model=DatabaseQueryRunResponse, include_in_schema=False)
def run_database_query_alias(query_id: str):
    return _execute_whitelisted_query(query_id)


@router.post("/admin/vg-queries/{query_id}/run", response_model=DatabaseQueryRunResponse, include_in_schema=False)
def run_database_query_legacy_alias(query_id: str):
    """Bakåtkompatibel sökväg."""
    return _execute_whitelisted_query(query_id)
