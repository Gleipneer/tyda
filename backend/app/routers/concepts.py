"""Endpoints för begrepp och post-begrepp-kopplingar."""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import CurrentUser, assert_owner_or_admin, get_current_user, get_current_user_optional, require_admin
from app.repositories import concept_repo, post_repo
from app.services.match_text import compose_post_text_for_match
from app.services.symbol_matcher import find_matches
from app.schemas.concepts import ConceptCreate, ConceptRead, PostConceptCreate, PostConceptRead

router = APIRouter()


def _row_to_concept(row: dict) -> dict:
    return {"begrepp_id": row["BegreppID"], "ord": row["Ord"], "beskrivning": row["Beskrivning"]}


def _can_view_post(user: CurrentUser | None, post: dict) -> bool:
    if post["synlighet"] == "publik":
        return True
    if user is None:
        return False
    owner = post["anvandar"]["anvandar_id"]
    return user.anvandar_id == owner or user.ar_admin


@router.get("/concepts", response_model=list[ConceptRead])
def list_concepts():
    """Hämtar alla begrepp (lexikon är publikt läsbart)."""
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
def create_concept(data: ConceptCreate, _: CurrentUser = Depends(require_admin)):
    """Skapar nytt begrepp (endast admin)."""
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
def update_concept(concept_id: int, data: ConceptCreate, _: CurrentUser = Depends(require_admin)):
    """Uppdaterar begrepp (endast admin)."""
    if not concept_repo.get_concept_by_id(concept_id):
        raise HTTPException(status_code=404, detail="Concept not found")
    concept_repo.update_concept(concept_id, data.ord.strip(), data.beskrivning.strip())
    return {"message": "Concept updated"}


@router.delete("/concepts/{concept_id}")
def delete_concept(concept_id: int, _: CurrentUser = Depends(require_admin)):
    """Tar bort begrepp (endast admin). PostBegrepp rensas via CASCADE."""
    if not concept_repo.get_concept_by_id(concept_id):
        raise HTTPException(status_code=404, detail="Concept not found")
    concept_repo.delete_concept(concept_id)
    return {"message": "Concept deleted"}


@router.get("/posts/{post_id}/matched-concepts")
def get_matched_concepts(
    post_id: int,
    user: CurrentUser | None = Depends(get_current_user_optional),
):
    post = post_repo.get_post_by_id(post_id)
    if not post or not _can_view_post(user, post):
        raise HTTPException(status_code=404, detail="Post not found")
    text = compose_post_text_for_match(post.get("titel"), post.get("innehall"))
    concepts = concept_repo.get_all_concepts()
    matches = find_matches(text, concepts, include_phrases=True)
    return {"matches": matches}


@router.get("/posts/{post_id}/concepts", response_model=list[PostConceptRead])
def list_post_concepts(
    post_id: int,
    user: CurrentUser | None = Depends(get_current_user_optional),
):
    post = post_repo.get_post_by_id(post_id)
    if not post or not _can_view_post(user, post):
        raise HTTPException(status_code=404, detail="Post not found")
    return concept_repo.get_concepts_by_post_id(post_id)


@router.post("/posts/{post_id}/concepts", status_code=201)
def link_concept(post_id: int, data: PostConceptCreate, user: CurrentUser = Depends(get_current_user)):
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    assert_owner_or_admin(user, post["anvandar"]["anvandar_id"])
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
def unlink_concept(post_begrepp_id: int, user: CurrentUser = Depends(get_current_user)):
    post_id = concept_repo.get_post_id_for_post_begrepp(post_begrepp_id)
    if post_id is None:
        raise HTTPException(status_code=404, detail="Post concept link not found")
    post = post_repo.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    assert_owner_or_admin(user, post["anvandar"]["anvandar_id"])
    n = concept_repo.delete_post_concept(post_begrepp_id)
    if n == 0:
        raise HTTPException(status_code=404, detail="Post concept link not found")
    return {"message": "Post concept link deleted"}
