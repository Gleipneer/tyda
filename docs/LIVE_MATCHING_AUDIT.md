# Live symbolmatchning (Ny post) – audit 2025-03-15

## Kedja (verifierad i kod)

| Steg | Plats | Vad som händer |
|------|--------|----------------|
| 1 | `NewPostPage` textarea `onChange` | `handleContentChange` uppdaterar `content`, sätter `isAnalyzing`, anropar debouncad analys med **titel + innehåll**. |
| 2 | `NewPostPage` titel `onChange` | `handleTitleChange` – samma (tidigare kördes **aldrig** analys vid titeländring). |
| 3 | Debounce | 400 ms, stabil callback (`useDebouncedCallback`) – samma ms ger **stabil funktionsidentitet** (tidigare skapades ny funktion varje render). |
| 4 | `analyzeTextConcepts` | `POST /api/analyze/text-concepts` med body `{"text":"<kombinerad text>"}`. **Ingen postId** – fungerar före sparning. |
| 5 | Backend `analyze.py` | `concept_repo.get_all_concepts()` → `find_matches(text, concepts, include_phrases=True)` → `{"matches":[...]}`. |
| 6 | Frontend state | `setMatchedConcepts(r.matches ?? [])`; fel sätter `analyzeError` (tidigare **tyst** `.catch` → tom lista). |
| 7 | UI | Sidopanel + inline "Tyda ser just nu" visar badges eller fel – inte samma tomma copy som vid lyckad tom träff när nätverket faller. |

## Var kedjan bröt (rotorsak)

1. **Tyst fel:** Vid 404/500/CORS/nätverk rensades träffar utan meddelande → samma UX som "lexikonet hittade inget".
2. **Titel ignorerades:** Live-analys skickade bara **textarea-innehåll**; sparad post använder `titel + innehall` i `matched-concepts` → inkonsekvent och missade nyckelord i titeln.
3. **Debouncad funktion ostabil:** Ny funktion varje render kunde ge onödiga re-runs och försvårade felsökning (inte bevisat som enda orsak till tomma träffar, men åtgärdad).

**Inget** i backend filtrerar bort träffar med confidence-threshold i `find_matches` (endast score-ordning och dedupe per `begrepp_id`).

## Payload / response (före → efter)

**Före (endast brödtext):**

```json
POST /api/analyze/text-concepts
{ "text": "Jag drömde ... berg ..." }
```

**Efter (samma endpoint, rikare text):**

```json
POST /api/analyze/text-concepts
{ "text": "Min titel\nJag drömde ... berg ..." }
```

Response oförändrad:

```json
{ "matches": [ { "begrepp_id", "ord", "beskrivning", "matched_token", "match_type", "score" } ] }
```

## Verifiering

- Backend: `pytest tests/test_analyze_text_concepts_api.py` (mockat lexikon, golden-text).
- Manuellt: kör backend + `npm run dev`, skriv golden-text i **Ny post** – ska se "N begrepp hittade" och badges; vid stoppad backend – röd felrad istället för falsk tomhet.
- Produktion: om frontend och API har olika origin, sätt `VITE_API_BASE` (se `frontend/src/services/api.ts`).

## Filer ändrade

- `frontend/src/pages/NewPostPage.tsx` – titel+innehåll, stabil debounce, fel-UI, `matches`-guard.
- `frontend/src/services/api.ts` – valfri `VITE_API_BASE`.
- `frontend/src/vite-env.d.ts` – typer för env.
- `backend/tests/test_analyze_text_concepts_api.py` – API + golden case.
- `docs/LIVE_MATCHING_AUDIT.md` – detta dokument.
