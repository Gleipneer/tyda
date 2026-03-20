"""
Gemensam textkomposition för symbolmatchning (live + sparad post).

Samma semantik som tidigare GET /posts/{id}/matched-concepts: titel och innehåll
konkateneras med ett mellanslag (inte radbrytning). Tokenisering i symbol_matcher
påverkas inte av ett vs flera whitespace mellan ord.
"""


def compose_post_text_for_match(titel: str | None, innehåll: str | None) -> str:
    """Deterministisk sammanslagning: trimmade delar, joinade med mellanslag."""
    parts = [(titel or "").strip(), (innehåll or "").strip()]
    return " ".join(p for p in parts if p)
