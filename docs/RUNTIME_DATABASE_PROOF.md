# Runtime-databas vs migrationer — bevis och kanonisk väg

**Datum:** 2025-03-15  
**Syfte:** Fastställa exakt vilken DB backend använder, att 6 rader i `Begrepp` = ofull migration, och hur det repareras reproducerbart.

---

## FAS 1 — Runtime-databas (faktisk kod)

| Fråga | Svar |
|--------|------|
| **DB-typ** | **Endast MySQL** via `mysql-connector-python` (`app/db.py`). **Ingen SQLite** i repot (grep: inga träffar). |
| **Anslutning** | `mysql.connector.connect(host=settings.DB_HOST, port=settings.DB_PORT, database=settings.DB_NAME, ...)` |
| **Konfiguration** | `pydantic-settings` läser **`backend/.env`** (`app/config.py`: `env_file = ".env"`). |
| **Standardvärden** (om `.env` saknar nycklar) | `DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME=reflektionsarkiv`, `DB_USER=root` |

**Bevis att det är just denna instans:** Alla repository-anrop använder `get_connection()` → samma `settings` som laddats vid processstart från **`backend/.env`** i arbetskatalogen `backend/`.

**Workbench vs app:** Workbench visar bara den databas du **kopplar mot** (host, port, användare, schema). Om Workbench är inloggad på **`localhost:3306`, databas `reflektionsarkiv`** och `.env` har samma värden → **samma** data. Om host/port/DB skiljer sig → **olika** data — då är observationen i Workbench **inte** appens runtime-DB.

**Verifiering:** Jämför Workbench-anslutning med:

```text
DB_HOST, DB_PORT, DB_NAME i backend/.env
```

(Visa inte lösenord publikt.)

---

## FAS 2 — Migrations- och seedkedja

| Kategori | Plats | Anmärkning |
|----------|--------|------------|
| **Basdump** | `reflektionsarkiv.sql` (projektrot) | Skapar schema + **~6** begrepp (gammal nivå) |
| **Kanonisk seed** | `database/migrations/001_*.sql` … `017_*.sql` | **Detta** fyller `Begrepp` till full lexikon |
| **Körning** | `backend/scripts/run_migration_utf8.py` | Ordning = tuplen `MIGRATIONS`; spårning i `schema_migrations` |
| **Mellanlager** | `backend/app/services/symbol_matcher.py` | **Inte** i DB; laddas i Python vid varje `find_matches` |
| **Startskript** | `scripts/start.ps1` / `start.sh` | Anropar `run_migration_utf8.py` automatiskt |

**Parallella / riskabla vägar:** Rå `mysql < migration.sql` på Windows utan UTF-8-hantering kan förstöra åäö — **kanon = Python-skriptet**.

---

## FAS 3 — Verifierat otillräcklig data (före reparation)

**Körning mot samma `.env` som appen (exempel från denna miljö):**

- `Begrepp` **före** migration: **6** rader (samma typ som basdump: orm, vatten, tempel, …)  
- Detta är **inte** den nivå Tyda:s matchning är byggd för efter migration `001`–`017`.

---

## FAS 4 — Reparation (reproducerbar)

**Ett kommando** (från katalogen `backend`, med aktiv `.env`):

```powershell
python scripts/run_migration_utf8.py
```

Vid första körning körs alla ännu ej spårade `.sql`-filer. Vid upprepning: redan körda filer hoppas över.

---

## FAS 5 — Bevis efter reparation (runtime)

**Samma miljö, efter `run_migration_utf8.py`:**

| Mätning | Värde |
|---------|--------|
| `Begrepp` (COUNT) | **394** |
| `schema_migrations` (COUNT) | **17** |
| Golden-text `find_matches` (via `verify_chain.py`) | **21** träffar |

**Skript:** `python scripts/verify_chain.py` — läser `Begrepp`, kör `find_matches` med golden-text, kräver ≥5 träffar.

**Mellanlager:** Träffar som `match_type: "inflected"` (t.ex. böjningar) i full körning visar att `symbol_matcher` inte är ren ordlista-lookup; exakt+inflected blandas i samma kedja.

---

## FAS 6 — End-to-end (API + UI)

| Steg | Verifiering |
|------|-------------|
| Backend | `GET http://127.0.0.1:8000/api/analyze/chain-status` → `begrepp_count` ≈ 394, `lexicon_suspect_incomplete: false` |
| Analys | `POST /api/analyze/text-concepts` med golden-text → `matches.length` > 0 |
| UI | Ny post: klistra text → badges / “N begrepp hittade” (kräver frontend + backend igång) |

---

## FAS 7 — Sammanfattning

1. **DB appen använder:** Den som **`backend/.env`** anger — **MySQL**, inte SQLite.  
2. **Workbench:** Samma som appen **om och endast om** host/port/databasnamn matchar `.env`.  
3. **Kanoniska filer:** `database/migrations/001`–`017` via `run_migration_utf8.py`.  
4. **Fel:** Migrationer hade inte körts (eller kördes mot annan instans) → 6 rader kvar.  
5. **Fix:** `python scripts/run_migration_utf8.py` mot rätt DB.  
6. **Row counts:** 6 → **394** (exempel från verifierad körning).  
7. **Mellanlager:** Python-modul `symbol_matcher`; används i `find_matches` (se `verify_chain` + `match_type`).  
8. **Live-matchning:** Läser `get_all_concepts()` → samma 394 rader.  
9. **Ren miljö:** Importera `reflektionsarkiv.sql` (eller låt `start.ps1` skapa DB) → kör **`python scripts/run_migration_utf8.py`** → starta backend → `python scripts/verify_chain.py` ska ge **OK**.

---

**Fix av hjälpskript:** `verify_chain.py` sätter `stdout` till UTF-8 där möjligt så Windows-konsolen inte kraschar på Unicode.
