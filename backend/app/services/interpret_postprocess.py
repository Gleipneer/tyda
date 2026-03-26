"""Efterbearbetning av AI-tolkning: minska tomma abstraktioner, förankra i källtexten."""
from __future__ import annotations

import re

from app.schemas.interpret import InterpretationSection

# Rubrikrad som slutar med kolon (en rad) — typisk lins-etikett i symbolic_lenses
_TITLE_LINE_ONLY = re.compile(r"(?m)^[^\n:]{4,100}:\s*$")

# Fraser som ofta blir utfyllnad om de inte binds till drömmens egna ord
_STALE_SUBSTRINGS = (
    "det okända",
    "det inre okända",
    "inre resa",
    "inre värld",
    "symbol för mystik",
    "full av mystik",
    "övernaturliga krafter",
    "övernaturlig",
    "en gåta från universum",
    "kosmiska tecken",
)

# Ord som sällan bär mening utan konkret förankring i meningen
_WEAK_WITHOUT_ANCHOR = frozenset(
    {
        "förändring",
        "förändringar",
        "utforskning",
        "transformation",
        "metamorfos",
        "mystik",
    }
)


def _significant_tokens(text: str, min_len: int = 4) -> set[str]:
    t = text.lower()
    return {m.group(0) for m in re.finditer(rf"\b[\wåäö]{{{min_len},}}\b", t, flags=re.IGNORECASE)}


def _sentence_has_anchor(sentence: str, anchors: set[str]) -> bool:
    sl = sentence.lower()
    for a in anchors:
        if a in sl:
            return True
    return False


def _is_stale_sentence(sentence: str, anchors: set[str]) -> bool:
    sl = sentence.lower().strip()
    if not sl:
        return False
    if _sentence_has_anchor(sentence, anchors):
        return False
    for bad in _STALE_SUBSTRINGS:
        if bad in sl:
            return True
    tokens = set(re.findall(r"\b[\wåäö]+\b", sl, flags=re.IGNORECASE))
    if tokens & _WEAK_WITHOUT_ANCHOR and len(sl) < 100:
        return True
    if "utforskning" in sl and "dröm" not in sl:
        return True
    return False


def trim_symbolic_lenses_content(content: str, *, max_blocks: int = 2) -> str:
    """
    Behåll högst `max_blocks` lins-block som börjar med en rubrikrad (…:).
    Ostrukturerad text: begränsa längd så modellen inte spiller över.
    """
    text = (content or "").strip()
    if not text:
        return text
    matches = list(_TITLE_LINE_ONLY.finditer(text))
    if not matches:
        return _soft_truncate_unstructured_lens(text)
    blocks: list[str] = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        blocks.append(text[m.start() : end].strip())
    picked = [b for b in blocks if b][:max_blocks]
    return "\n\n".join(picked).strip()


def _soft_truncate_unstructured_lens(text: str, *, max_paragraphs: int = 2, max_chars: int = 900) -> str:
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paras:
        return text.strip()
    out = "\n\n".join(paras[:max_paragraphs])
    if len(out) <= max_chars:
        return out
    cut = out[: max_chars].rsplit(" ", 1)[0].strip()
    return cut + "…" if cut else out[:max_chars] + "…"


def trim_reflection_questions_content(content: str, *, max_questions: int = 2) -> str:
    text = (content or "").strip()
    if not text:
        return text
    chunks = re.split(r"(?<=\?)\s+", text)
    qs = [c.strip() for c in chunks if "?" in c]
    if not qs:
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        qs = [ln for ln in lines if "?" in ln]
    if not qs:
        return text
    return "\n".join(qs[:max_questions])


def trim_caution_brief(content: str, *, max_sentences: int = 1) -> str:
    text = (content or "").strip()
    if not text:
        return text
    parts = re.split(r"(?<=[.!?])\s+", text)
    parts = [p.strip() for p in parts if p.strip()]
    if not parts:
        return text
    return " ".join(parts[:max_sentences])


def refine_dream_section_content(content: str, source_text: str) -> str:
    """Tar bort korta meningar som bara återger generiska klanger utan att röra drömmens egna bilder."""
    raw = (content or "").strip()
    if not raw:
        return raw
    anchors = _significant_tokens(source_text)
    # Behåll radbrytningar för frågor, men dela grovt på meningar
    paragraphs = [p.strip() for p in raw.split("\n\n") if p.strip()]
    out_paras: list[str] = []
    for para in paragraphs:
        chunks = re.split(r"(?<=[.!?])\s+", para)
        kept = [c.strip() for c in chunks if c.strip() and not _is_stale_sentence(c, anchors)]
        if kept:
            out_paras.append(" ".join(kept))
    if not out_paras:
        return raw
    return "\n\n".join(out_paras)


def postprocess_interpretation_sections(
    sections: list[InterpretationSection],
    *,
    source_text: str,
    kind: str,
) -> list[InterpretationSection]:
    if kind != "dream":
        return sections
    src = source_text or ""
    out: list[InterpretationSection] = []
    for s in sections:
        if s.id == "symbolic_lenses":
            body = trim_symbolic_lenses_content(refine_dream_section_content(s.content, src))
        elif s.id == "reflection_prompt":
            body = trim_reflection_questions_content(refine_dream_section_content(s.content, src))
        elif s.id == "caution":
            body = trim_caution_brief(refine_dream_section_content(s.content, src))
        else:
            body = refine_dream_section_content(s.content, src)
        out.append(InterpretationSection(id=s.id, title=s.title, content=body))
    return out
