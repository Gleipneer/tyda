# Begreppsdetektion – rotorsak, kedja och verifiering

**Datum:** 2025-03-15  
**Scope:** Automatiska träffar (`Automatiskt hittade i texten`) från databas → `symbol_matcher` → `GET /api/posts/{id}/matched-concepts` → `PostDetailPage`.

---

## 1. Rotorsaksanalys

### Vad som var fel

| Lager | Problem |
|--------|---------|
| **Databas / lexikon** | Flera **basord** som förekommer i profetisk/symbolisk text (t.ex. Daniel 2) **saknades** i `Begrepp`: bl.a. **brons, järn, lera, huvud** (och **staty** som hjälper golden case). Övriga ord som berg, sten, guld, silver, vind m.m. fanns redan i tidigare migrationer (t.ex. `003_lexicon_250.sql`). |
| **Matcher** | Endast **exakt basform** + begränsad normalisering räcker inte för svenska **böjningar** (t.ex. *fötterna* → *fot*, *silvret* → *silver*, *leran* → *lera*). Dessa krävde explicita **VARIANT→bas**-rader i `symbol_matcher.py`, inte bara naiv substring. |
| **API** | Kontraktet `{ "matches": [...] }` var korrekt; felet var **tomma eller för svaga matchlistor** p.g.a. lexikon + variantlogik, inte fel serialisering. |
| **UI** | Visade **"inga träffar"** när backend legitimat returnerade `matches: []` — samma symptom som vid tunt lexikon. **Ingen** särskild signal om att lexikonet var för litet (t.ex. migrationer ej körda). |

### Varför UI visade noll träffar

1. Posttexten innehöll ord som **inte fanns** som rader i `Begrepp`, eller bara i **böjd form** utan mappning till basord.  
2. `find_matches()` kan bara hitta det som finns i lexikonet + det som täcks av **tokenisering + normalisering + VARIANT-tabellen**.  
3. Frontend hämtar `GET .../matched-concepts` och visar `matched.matches`; om listan är tom visas tomstatus — korrekt beteende men **svårt att skilja** "texten matchar inget" från "databasen är undermigrerad".

---

## 2. Åtgärder (filer)

| Fil | Ändring |
|-----|---------|
| `database/migrations/017_metall_kropp_daniel.sql` | `INSERT ... ON DUPLICATE KEY UPDATE` för **brons, järn, lera, huvud, staty**. |
| `backend/scripts/run_migration_utf8.py` | `017_metall_kropp_daniel.sql` i `MIGRATIONS`. |
| `backend/app/services/symbol_matcher.py` | Utökade **VARIANT_TO_BASE** (bl.a. fötter/fötterna, silvret, leran, bronset, huvud*, staty*); `build_match_trace()` för debug. |
| `backend/app/config.py` | `TYDA_MATCH_DEBUG: bool = False`. |
| `backend/app/routers/analyze.py` | `find_matches(..., include_phrases=True)`; `POST /api/analyze/match-trace` (404 om debug av). |
| `backend/.env.example` | `TYDA_MATCH_DEBUG=false`. |
| `backend/tests/test_symbol_matcher_daniel.py` | Golden case Daniel-text, normalisering, varianter, trace-struktur. |
| `frontend/src/pages/PostDetailPage.tsx` | Hämtar **hela lexikonet** (`fetchConcepts`) för att vid tomma auto-träffar visa om **&lt; 40** begrepp (misstänkt undermigrerad DB). |

---

## 3. Tester

| Test | Syfte |
|------|--------|
| `tests/test_symbol_matcher_daniel.py` | Daniel-golden case, direkt träff, case, interpunktion, plural/varianter (fötterna, silvret, leran), trace. |
| `tests/test_interpret_contracts.py` | API-kontrakt för tolkning (kräver installerade deps, se nedan). |

**Körning (backend venv):**

```powershell
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m pytest tests/test_symbol_matcher_daniel.py -q
```

Om `ModuleNotFoundError: jwt`: aktivera venv där `PyJWT` är installerat (`requirements.txt` pin: `PyJWT==2.9.0`).

---

## 4. Bevis / verifiering

### 4.1 Databas

Efter migration:

```sql
SELECT Ord FROM Begrepp WHERE Ord IN ('berg','sten','guld','silver','brons','järn','lera','vind','huvud','staty');
SELECT COUNT(*) FROM Begrepp;
```

Kör migration:

```powershell
cd backend
python scripts/run_migration_utf8.py
```

### 4.2 API

```http
GET /api/posts/{post_id}/matched-concepts
```

Förväntat: JSON med `matches` (lista med bl.a. `begrepp_id`, `ord`, `matched_token`, `score`).

Med debug (endast om `TYDA_MATCH_DEBUG=true`):

```http
POST /api/analyze/match-trace
```

### 4.3 UI

Öppna en post med Daniel-texten; under **Automatiskt hittade i texten** ska flera rader visas. Om **0** träffar men lexikonet visar **&lt; 40** begrepp i appen: kontrollera att migrationer körts mot samma DB som backend.

---

## 5. Kvarvarande begränsningar

- **Full morfologi** för svenska finns inte; nya böjningar kan kräva nya **VARIANT**-rader eller nya **basord** i `Begrepp`.  
- **Sammansatta ord** hanteras begränsat (token-baserat flöde — se `symbol_matcher.py`).  
- **match-trace** ska inte exponeras i produktion utan `TYDA_MATCH_DEBUG=true`.

---

## 6. Admin-kedja

- Admin **skapar/uppdaterar** begrepp via API → `Begrepp` uppdateras.  
- `get_matched_concepts` anropar `concept_repo.get_all_concepts()` vid **varje request** → nya ord ingår direkt i matchning utan omstart (förutsatt samma DB).

---

## Referens: golden testtext

Se `backend/tests/test_symbol_matcher_daniel.py` (`DANIEL_TEXT`).
