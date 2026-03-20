"""
Endpoints för automatisk textanalys och symbolmatchning.
Deterministisk matchning mot Begrepp-biblioteket.
"""
from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from app.config import settings
from app.repositories import concept_repo
from app.services.symbol_matcher import build_match_trace, find_matches

router = APIRouter()


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
