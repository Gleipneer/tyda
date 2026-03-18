"""
Endpoints för automatisk textanalys och symbolmatchning.
Deterministisk matchning mot Begrepp-biblioteket.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.repositories import concept_repo
from app.services.symbol_matcher import find_matches

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
    matches = find_matches(data.text or "", concepts)
    return {"matches": matches}
