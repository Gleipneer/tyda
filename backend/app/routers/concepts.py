"""Endpoints för begrepp och post-begrepp-kopplingar."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user_id
from app.repositories import concept_repo, post_repo
from app.services.symbol_matcher import find_matches
from app.schemas.concepts import ConceptRead, ConceptCreate, PostConceptRead, PostConceptCreate

router = APIRouter()


def _row_to_concept(row: dict) -> dict:
    return {"begrepp_id": row["BegreppID"], "ord": row["Ord"], "beskrivning": row["Beskrivning"]}


@router.get("/concepts", response_model=list[ConceptRead])
def list_concepts():
    """Hämtar alla begrepp."""
    rows = concept_repo.get_all_concepts()
    return [_row_to_concept(r) for r in rows]


@router.get("/concepts/{concept_id}", response_model=ConceptRead)
def get_concept(concept_id: int):
    """Hämtar ett begrepp."""
    row = concept_repo.get_concept_by_id(concept_id)
    if not row:
        raise HTTPException(status_code=404, detail="Concept not found")
    return _row_to_concept(row)


@router.post("/concepts", status_code=201)
def create_concept(data: ConceptCreate):
    """Skapar nytt begrepp."""
    if not data.ord or not data.ord.strip():
        raise HTTPException(status_code=400, detail="Ord is required")
    if not data.beskrivning or not data.beskrivning.strip():
        raise HTTPException(status_code=400, detail="Beskrivning is required")
    try:
        cid = concept_repo.create_concept(data.ord.strip(), data.beskrivning.strip())
        return {"begrepp_id": cid, "message": "Concept created"}
    except Exception as e:
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Ord already exists")
        raise


@router.put("/concepts/{concept_id}")
def update_concept(concept_id: int, data: ConceptCreate):
    """Uppdaterar begrepp."""
    if not concept_repo.get_concept_by_id(concept_id):
        raise HTTPException(status_code=404, detail="Concept not found")
    concept_repo.update_concept(concept_id, data.ord.strip(), data.beskrivning.strip())
    return {"message": "Concept updated"}


@router.delete("/concepts/{concept_id}")
def delete_concept(concept_id: int):
    """Tar bort begrepp."""
    if not concept_repo.get_concept_by_id(concept_id):
        raise HTTPException(status_code=404, detail="Concept not found")
    concept_repo.delete_concept(concept_id)
    return {"message": "Concept deleted"}


@router.get("/posts/{post_id}/matched-concepts")
def get_matched_concepts(post_id: int):
    """
    Automatisk matchning: analyserar postens titel och innehåll mot Begrepp.
    Returnerar begrepp som systemet hittat i texten (manuella kopplingar separat).
    """
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    text = f"{post.get('titel', '')} {post.get('innehall', '')}"
    concepts = concept_repo.get_all_concepts()
    matches = find_matches(text, concepts)
    return {"matches": matches}


@router.get("/posts/{post_id}/concepts", response_model=list[PostConceptRead])
def list_post_concepts(post_id: int):
    """Hämtar begrepp manuellt kopplade till en post."""
    if not post_repo.get_post_by_id(post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return concept_repo.get_concepts_by_post_id(post_id)


@router.post("/posts/{post_id}/concepts", status_code=201)
def link_concept(post_id: int, data: PostConceptCreate, user_id: int = Depends(get_current_user_id)):
    """Kopplar begrepp till post. Endast postens ägare."""
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["anvandar"]["anvandar_id"] != user_id:
        raise HTTPException(status_code=403, detail="Du kan bara koppla begrepp till egna poster")
    if not concept_repo.get_concept_by_id(data.begrepp_id):
        raise HTTPException(status_code=404, detail="Concept not found")
    try:
        pid = concept_repo.link_concept_to_post(post_id, data.begrepp_id)
        return {"post_begrepp_id": pid, "message": "Concept linked to post"}
    except Exception as e:
        if "Duplicate" in str(e) or "UNIQUE" in str(e):
            raise HTTPException(status_code=400, detail="Concept already linked to post")
        raise


@router.delete("/post-concepts/{post_begrepp_id}")
def unlink_concept(post_begrepp_id: int, user_id: int = Depends(get_current_user_id)):
    """Tar bort koppling mellan post och begrepp. Endast postens ägare."""
    owner = concept_repo.get_post_owner_for_post_begrepp(post_begrepp_id)
    if owner is None:
        raise HTTPException(status_code=404, detail="Post concept link not found")
    if owner != user_id:
        raise HTTPException(status_code=403, detail="Du kan bara ta bort kopplingar på egna poster")
    n = concept_repo.delete_post_concept(post_begrepp_id)
    if n == 0:
        raise HTTPException(status_code=404, detail="Post concept link not found")
    return {"message": "Post concept link deleted"}
