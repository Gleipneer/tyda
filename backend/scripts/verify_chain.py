"""
Verifierar matchkedjan mot den databas som backend/.env pekar på (ingen lösenordsutskrift).

Kör från backend-katalogen:
  python scripts/verify_chain.py

Utdata: DB-anslutning, begrepp_count, migrationer, POST /analyze/text-concepts med golden-text (minsta antal träffar).
Kräver att MySQL körs och att migrationer körts.
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import check_db_connection  # noqa: E402
from app.repositories import concept_repo  # noqa: E402
from app.services.symbol_matcher import find_matches  # noqa: E402

GOLDEN = (
    "Jag drömde att jag stod inför en enorm staty som kändes både mäktig och skrämmande. "
    "Huvudet var av guld, bröstet och armarna av silver, magen och höfterna av brons, benen av järn "
    "och fötterna var en blandning av järn och lera. Medan jag såg på kom en sten, inte huggen av människohand, "
    "och träffade statyn på fötterna. Då föll hela statyn sönder. Guldet, silvret, bronset, järnet och leran "
    "maldes ner till stoft och blåste bort i vinden. Sedan började stenen växa tills den blev ett stort berg "
    "som fyllde hela jorden."
)


def main() -> int:
    from app.config import settings  # noqa: E402

    # Windows-konsol (cp1252) kraschar på vissa Unicode-tecken i print
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("DB_HOST=", settings.DB_HOST, " DB_NAME=", settings.DB_NAME, " DB_USER=", settings.DB_USER, sep="")
    if not check_db_connection():
        print("FAIL: databasanslutning")
        return 1
    n = concept_repo.count_begrepp()
    m = concept_repo.count_schema_migrations()
    print("Begrepp-rader:", n)
    print("schema_migrations-rader:", m)
    concepts = concept_repo.get_all_concepts()
    matches = find_matches(GOLDEN, concepts, include_phrases=True)
    print("Golden-text träffar:", len(matches))
    print("Exempel (högst score):", json.dumps(matches[:8], ensure_ascii=False, indent=2))
    if len(matches) < 5:
        print("FAIL: förvänta minst 5 träffar med fullt lexikon efter migrationer.")
        return 1
    print("OK: kedjan DB -> find_matches ger tillräckligt många träffar.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
