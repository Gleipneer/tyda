"""
Endpoints för automatisk textanalys och symbolmatchning.
Deterministisk matchning mot Begrepp-biblioteket.
"""
from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from app.config import settings
from app.db import check_db_connection
from app.migrations_meta import MIGRATION_COUNT
from app.repositories import concept_repo
from app.services.symbol_matcher import build_match_trace, find_matches

router = APIRouter()

# Minsta antal begrepp under vilket UI bör misstänka ofull migration (samma tröskel som run_migration_utf8 legacy-hjälp)
_LEXICON_WARN_THRESHOLD = 80


@router.get("/analyze/chain-status")
def analyze_chain_status():
    """
    Diagnostik för hela matchkedjan: DB uppkopplad, lexikonstorlek, migrationsspårning.
    Samma Begrepp-datakälla som POST /analyze/text-concepts.
    """
    if not check_db_connection():
        return {
            "ok": False,
            "database": "disconnected",
            "begrepp_count": 0,
            "schema_migrations_applied": None,
            "lexicon_suspect_incomplete": True,
            "expected_migrations_files": MIGRATION_COUNT,
            "hint": "Kontrollera MySQL och backend/.env (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD).",
        }
    n = concept_repo.count_begrepp()
    m = concept_repo.count_schema_migrations()
    expected = MIGRATION_COUNT
    suspect = n < _LEXICON_WARN_THRESHOLD or (m is not None and m < expected)
    return {
        "ok": True,
        "database": "connected",
        "begrepp_count": n,
        "schema_migrations_applied": m,
        "lexicon_suspect_incomplete": suspect,
        "expected_migrations_files": MIGRATION_COUNT,
        "hint": (
            "Kör från backend: python scripts/run_migration_utf8.py"
            if suspect
            else "Lexikon och migrationsspårning ser rimliga ut för utveckling."
        ),
    }


class AnalyzeTextRequest(BaseModel):
    """Request för textanalys."""

    text: str


@router.post("/analyze/text-concepts")
def analyze_text_concepts(data: AnalyzeTextRequest):
    """
    Matchar text mot Begrepp-biblioteket.
    Returnerar automatiskt hittade begrepp med beskrivningar.
    Hanterar böjningsformer (ormen→orm, vattnet→vatten) och relaterade ord.
    """
    concepts = concept_repo.get_all_concepts()
    matches = find_matches(data.text or "", concepts, include_phrases=True)
    return {"matches": matches}


@router.post("/analyze/match-trace")
def analyze_match_trace(data: AnalyzeTextRequest):
    """
    Felsökningsendpoint: tokenlista, kandidatgrundformer, träffar.
    Endast aktiv när TYDA_MATCH_DEBUG=true i miljö (aldrig exponera i produktion utan behov).
    """
    if not settings.TYDA_MATCH_DEBUG:
        raise HTTPException(status_code=404, detail="Match trace is disabled (set TYDA_MATCH_DEBUG=true in .env)")
    concepts = concept_repo.get_all_concepts()
    return build_match_trace(data.text or "", concepts)
