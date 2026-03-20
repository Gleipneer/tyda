# Tyda / Reflektionsarkiv — E2E-kedja (rapport)

**Datum:** 2025-03-15  
**Syfte:** Strikt sanning om DB → migrationer → lexikon → `symbol_matcher` → API → live UI → sparad post — utan att stanna vid “build green”.

**Om “agentsvärm”:** I denna miljö finns inget separat verktyg som kör flera oberoende agenter parallellt mot samma repo. Arbetet har utförts som **ett systematiskt end-to-end-pass** (inventering → kod → tester → runtime-skript → rapport). För parallell granskning kan teamet manuellt dela upp faserna mellan personer.

---

## FAS 1 — Inventering (faktisk kod)

### A. Startkedja

| Fråga | Svar (kod/repo) |
|--------|------------------|
| Hur startas backend? | `uvicorn app.main:app` (manuellt) eller `scripts/start.ps1` / `start.sh` |
| Init av DB? | `reflektionsarkiv.sql` (bas) **eller** `start.ps1` försöker `mysql < reflektionsarkiv.sql` om DB saknas |
| Migrationer? | **Manuellt** via `backend/scripts/run_migration_utf8.py`; **automatisk** vid `.\scripts\start.ps1` (rad `Invoke-DatabaseMigrations`) |
| Seed? | Ingen separat “seed”-fil utöver **SQL-migrationer** som fyller `Begrepp` |
| Dev-DB | Den som `backend/.env` pekar på (`DB_HOST`, `DB_NAME`, …) |
| Risk fel DB? | **Ja** om `.env` pekar mot annan instans än den du migrerat eller om `reflektionsarkiv.sql` importerats utan att köra migrationer (då ~6 begrepp i basdump) |

### B. Databaslagret (analyskedjan)

| Tabell | Roll |
|--------|------|
| `Begrepp` | Lexikonord (`Ord`, `Beskrivning`) — **enda** tabellen för ordlista i matchning |
| `schema_migrations` | Spårning av körda `.sql`-filer (skapas av migreringsskriptet) |
| `PostBegrepp` | Manuella kopplingar — **inte** automatiska träffar |

**Mellanlager:** **inte** i separata tabeller. Det ligger i **Python** (`app/services/symbol_matcher.py`): `VARIANT_TO_BASE`, `SYNONYM_TO_BASE`, `RELATED_TO_BASE`, `PHRASE_RULES`, normalisering, tokenisering. Byggs **vid körning** tillsammans med rader från `Begrepp`.

### C. Analyskedja (live)

1. `NewPostPage`: `onChange` titel/innehåll → debounce 400 ms  
2. `composePostTextForMatch(titel, innehåll)` → samma semantik som sparad post  
3. `POST /api/analyze/text-concepts` `{ "text": "..." }`  
4. `concept_repo.get_all_concepts()` → `find_matches(..., include_phrases=True)`  
5. `{ "matches": [...] }` → UI (badges, fel vid nätverk/HTTP-fel)

### D. Spar-kedja

- Post sparas via `POST /api/posts`  
- Efter sparning: `GET /api/posts/{id}/matched-concepts` använder `compose_post_text_for_match(titel, innehåll)` + **samma** `find_matches` som live.

---

## FAS 2 — Startscript / migration (kanonisk)

**Kanoniskt för utveckling (Windows):**  
`.\scripts\start.ps1` från **projektroten**

**Steg (verifierat i `scripts/start.ps1`):**

1. Kopiera `.env` om saknas  
2. Skapa venv + `pip install -r requirements.txt`  
3. `npm install` i frontend  
4. Valfri import av `reflektionsarkiv.sql` om databas saknas (`mysql`-klient krävs)  
5. **`python scripts/run_migration_utf8.py`** (UTF-8, `schema_migrations`)  
6. Starta uvicorn `:8000`, vänta på `/api/health` + `/api/db-health`  
7. Starta Vite  

**Manuell migration (samma som startskript):**  
`cd backend` → `python scripts/run_migration_utf8.py`

**Parallella / förvirrande vägar:**  
- Rå `mysql < fil.sql` på Windows utan UTF-8 → **kan korrumpera åäö** (dokumenterat i `run_migration_utf8.py`). **Kanon = Python-skriptet.**  
- `README - kopia.md` — potentiellt föråldrad; **primär: `README.md`**

---

## FAS 3 — Mellanlager används

| Påstående | Bevis |
|------------|--------|
| Live använder mellanlager | `analyze_text_concepts` anropar `find_matches` som använder `VARIANT_TO_BASE` m.m. |
| Sparad post samma | `get_matched_concepts` anropar samma `find_matches` |
| Inte bara exakt sträng | Tester: `test_symbol_matcher_daniel.py` (t.ex. `drömde`→`dröm`, `fötterna`→`fot`); `test_analyze_text_concepts_api.py` med mockat lexikon |

---

## FAS 4 — Golden-text & runtime-bevis

**Golden-text** (i `backend/scripts/verify_chain.py` och tester):

> *"Jag drömde att jag stod inför en enorm staty..."* (full text i skriptet)

**Runtime på den maskin där detta kördes (2025-03-15):**

```
python scripts/verify_chain.py
```

**Resultat (faktisk output):**

- `Begrepp-rader: 6`  
- `schema_migrations-rader: None` (tabell saknas eller fel vid räkning)  
- `Golden-text träffar: 0`  
- **Exit code 1** — `FAIL: förvänta minst 5 träffar med fullt lexikon efter migrationer.`

**Slutsats med evidens:** Den anslutna databasen är **inte** i tillstånd efter full lexikon-migration. **Blockerare** för äkta E2E-träffar i UI: kör `python scripts/run_migration_utf8.py` mot **samma** DB som `.env`, verifiera `Begrepp`-antal (>>80) och att `schema_migrations` innehåller rader.

**Efter fix (förväntat):** `verify_chain.py` ska skriva `OK` och lista exempelträffar.

**UI/E2E i webbläsare:** Har **inte** körts i denna session (ingen garanti att backend+frontend var igång här). **Kvar:** manuellt öppna Ny post, klistra golden-text, bekräfta badges + `GET /api/analyze/chain-status`.

---

## FAS 5 — Självdiagnostik (implementerat)

| Kontroll | Var |
|----------|-----|
| A–F (feltyp) | `GET /api/analyze/chain-status` — `begrepp_count`, `schema_migrations_applied`, `lexicon_suspect_incomplete`, `hint` |
| Frontend | `NewPostPage` hämtar chain-status och visar raden **“Kedjestatus:”** |
| Runtime-skript | `backend/scripts/verify_chain.py` |

---

## FAS 6 — Kontrakt live vs sparad (efter fix)

| Aspekt | Före (problem) | Efter |
|--------|----------------|--------|
| Titel + innehåll | Live kunde använda `\n`-join; sparad använde `" ".join` via f-string | **Gemensamt:** `compose_post_text_for_match` (backend) + `composePostTextForMatch` (frontend), samma mellanslag |
| Matchfunktion | Redan samma `find_matches` | Oförändrat |
| Mellanlager | Redan samma | Oförändrat |

---

## FAS 7 — Tester (tillagda/uppdaterade)

| Test | Fil | Vad |
|------|-----|-----|
| API golden + tom lexikon + 422 | `tests/test_analyze_text_concepts_api.py` | |
| compose + chain-status + migration sync | `tests/test_match_text_and_chain.py` | `len(MIGRATIONS)==MIGRATION_COUNT` |
| Daniel / symbol | `tests/test_symbol_matcher_daniel.py` | Oförändrad men ingår i suite |
| Frontend compose | `frontend/src/lib/matchText.test.ts` | Vitest |

---

## FAS 9 — Obligatorisk rapport (punktlista)

### 1. Kanonisk startkedja

- **`.\scripts\start.ps1`** (Windows) eller `./scripts/start.sh`  
- DB: värd från `backend/.env`  
- Migration: **`backend/scripts/run_migration_utf8.py`** (ingår i startskript)

### 2. Nulägesfel (identifierat)

- **Lokal DB i verify-körning:** endast **6** `Begrepp`, **0** golden-träffar → migration/lexikon inte applicerat på den instansen.  
- Tidigare: **tyst API-fel** gav tom UI (åtgärdat med `analyzeError`).  
- Tidigare: **divergens** titel/innehåll join (åtgärdat med `compose_*`).

### 3. DB och injektion

- Filer: `001`…`017` enligt `MIGRATIONS` i `run_migration_utf8.py`  
- `app/migrations_meta.MIGRATION_COUNT` måste matcha `len(MIGRATIONS)` (assert vid laddning av migreringsskript + pytest)

### 4. Mellanlager

- **Kod:** `symbol_matcher.py`  
- **Används i:** `POST /analyze/text-concepts`, `GET /posts/{id}/matched-concepts`  
- **Bevis:** enhetstester + mockad API-test + (när DB är full) `verify_chain.py`

### 5. API-kedja

- **Request:** `POST /api/analyze/text-concepts` body `{ "text": string }`  
- **Response:** `{ "matches": [ { begrepp_id, ord, beskrivning, matched_token, match_type, score } ] }`  
- **Diagnostik:** `GET /api/analyze/chain-status`

### 6. Frontend

- **Editor:** `composePostTextForMatch(title, content)` → `analyzeTextConcepts`  
- **Fel:** visas explicit, inte som “inga spår”  
- **Kedjestatus:** en rad under Tyda-panelen

### 7. Golden-text-resultat

- **Med mockat lexikon (CI):** flera träffar (`test_analyze_text_concepts_api.py`)  
- **Med nuvarande lokal DB (verify_chain):** **0** träffar — se FAS 4

### 8. Tester

- Se FAS 7

### 9. Kvarvarande risker

- **Mänsklig faktor:** fel `.env` mot annan MySQL än den som migrerats  
- **Basdump utan migrationer:** 6 begrepp → nästan inga symbolträffar  
- **Produktion:** `VITE_API_BASE` måste sättas om API inte delar origin med frontend  
- **Browser-E2E:** Playwright finns (`e2e-runtime`) men full golden-verifiering kräver **migrerad** DB

### 10. Definition of Done (ja/nej)

| Kriterium | Svar |
|-----------|------|
| Migrationer körs korrekt (i repo/skript) | **Ja** (skript + tester för antal) |
| Seed/injektion (via SQL-migrationer) | **Ja** (ingen separat seed) |
| Rätt DB används | **Kan endast sägas per miljö** — `.env` styr; **denna maskin: nej** (6 rader) tills användaren kör migrationer |
| Begrepp finns i DB | **I kod efter migration: ja** — **på denna verifierade DB: nej** |
| Mellanlager används | **Ja** (kod + tester) |
| Liveanalys fungerar | **Ja** i kod; **runtime här blockerad** av tunt lexikon |
| Sparad analys fungerar | **Samma kodväg**; **samma DB-krav** |
| Frontend visar träffar | **Ja** när API returnerar träffar |
| Frontend visar fel korrekt | **Ja** |
| Hela kedjan verifierad i praktiken | **Delvis** — **full E2E i webbläsare + migrerad DB: kvar hos användaren** |

---

**Signatur:** Denna rapport prioriterar **mätbar evidens**. `verify_chain.py` exit 1 på nuvarande DB är **önskvärd** — den förhindrar falsk “allt grönt”.
