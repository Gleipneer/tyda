# Reflektionsarkiv

Webbapplikation ovanpå databasen `reflektionsarkiv`. Användare kan skriva poster, koppla begrepp, se automatchade symboler och (valfritt) få AI-tolkning av drömmar.

**Joakim Emilsson – YH24**

## Stack

- **Backend:** Python 3.12+, FastAPI, MySQL (mysql-connector-python)
- **Frontend:** React, Vite, TypeScript
- **Databas:** MySQL (reflektionsarkiv)

## Starta projektet

**Snabbstart (efter första gångens setup):** Kör från projektroten:

```powershell
.\scripts\start.ps1
```

På Mac/Linux: `./scripts/start.sh` (kräver `chmod +x scripts/start.sh` första gången).

Skriptet frigör port 8000 och 5173 om de är upptagna, startar backend i bakgrunden och frontend i förgrunden. Backend: http://127.0.0.1:8000, Frontend: http://localhost:5173.

---

**Manuell start (viktig ordning):** Databas → Migrationer → Backend → Frontend.

### 1. Databas

Se till att MySQL körs. Skapa databasen:

```bash
mysql -u root -p < reflektionsarkiv.sql
```

### 2. Migrationer (utökar begreppsbiblioteket)

Kör från `backend/`-katalogen så att `.env` laddas:

```bash
cd backend
python scripts/run_migration_utf8.py
```

### 3. Backend

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
# Redigera .env: DB_PASSWORD måste anges

uvicorn app.main:app --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Öppna http://localhost:5173

### Valfritt: AI-tolkning

Lägg `OPENAI_API_KEY=sk-...` i `backend/.env` för att aktivera AI-tolkning på postdetaljsidan. Nyckeln används endast server-side och exponeras aldrig i frontend.

## Frontend just nu

- Navigationen är mobile-first: toppnavigation på större skärmar och menyknapp på smalare vyer.
- Aktiv användare väljs på startsidan och kan lämnas via `Byt användare` i headern på desktop eller i menyn på smalare vyer.
- Skrivflödet ligger i `Ny post`: titel, innehåll, kategori och synlighet. Utkast sparas lokalt per aktiv användare.
- Kategori väljs vid skapande av posten. UI:t använder främst `Privat` och `Offentlig`; i databasen/API:t finns värdena `privat`, `delad`, `publik`.
- AI-tolkning körs från postdetaljen och har nu modellval i UI:t. Frontend hämtar tillåtna modeller från backend och skickar vald modell till interpret-endpointen.
- Databasen är fortfarande avsiktligt liten: 6 tabeller, 1 trigger, 1 lagrad procedur. Automatisk matchning och AI-tolkning ligger främst i backend, inte i schemat.
- Testbarheten bygger just nu främst på stabila routes, roller/labels/placeholders och runtime-testet för ny-post-flödet i `frontend/e2e-runtime/newpost-runtime.spec.ts`.

## API

- `GET /api/health` – backend igång
- `GET /api/db-health` – databasanslutning
- `GET /api/users` – användare
- `GET /api/categories` – kategorier
- `GET /api/posts` – poster
- `POST /api/posts` – skapa post
- `POST /api/posts/{id}/interpret` – AI-tolkning (kräver OPENAI_API_KEY)
- m.fl. (se docs/API_PLAN.md)

## Dokumentation

- `docs/DATABASE_HELP.md` – databasen förklarad (pedagogiskt)
- `docs/API_PLAN.md` – API-endpoints
- `frontend/public/runbook.md` – praktisk runbook för start, manuell användning och test
- `docs/STATUS.md` – projektstatus
- `docs/BEGREPP_LEXIKON.md` – begreppsbibliotek
