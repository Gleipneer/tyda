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

Ny i projektet? Las `KOMPANJON.md` i projektroten for en steg-for-steg-guide.

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
- Kategori väljs vid skapande av posten. UI:t använder `Privat` och `Publik`; i databasen/API:t finns värdena `privat` och `publik`.
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

## Säkerhetsstrategi

Databasen följer least-privilege: applikationen använder en dedikerad användare `reflektionsarkiv_app` med endast DML-rättigheter (SELECT, INSERT, UPDATE, DELETE). DROP/CREATE/ALTER ges inte till app-användaren. Skriptet `database/scripts/grants.sql` skapar användaren och sätter rättigheter. Kör det som root/admin innan produktion:

```bash
mysql -u root -p < database/scripts/grants.sql
```

## Reflektion – databasval och design

### Varför MySQL / relationsdatabas

Projektet använder en relationsdatabas (MySQL) eftersom datan är strukturerad: användare, poster, kategorier, begrepp och kopplingar mellan dem. Relationsmodellen med primärnycklar, främmande nycklar och JOIN:s passar väl. NoSQL (t.ex. dokument- eller nyckelvärdesdatabas) hade krävt mer applikationslogik för relationer som redan löses enkelt i SQL.

### Varför denna tabellstruktur

- **Anvandare, Kategorier, Poster, Begrepp** – separata tabeller för återanvändning och normalisering.
- **PostBegrepp** – kopplingstabell för många-till-många mellan Poster och Begrepp. En post kan ha många begrepp, ett begrepp kan finnas i många poster. UNIQUE(PostID, BegreppID) hindrar dubbletter.
- **AktivitetLogg** – enkel logg separat från postdatan. Triggern skriver en rad när en post skapas.

### Varför Synlighet bara är privat och publik

Tidigare fanns `delad` som tredje alternativ. Det togs bort för att förenkla: användaren behöver veta om posten är privat (bara i mitt rum) eller publik (synlig i Utforska). Två tydliga lägen räcker för kursnivån.

### Varför PostBegrepp saknar Kommentar

Kolumnen Kommentar togs bort som designval. Ingen UI använde den, och modellen blev enklare. Manuella begreppskopplingar sparas utan kommentar.

### Varför triggern och proceduren finns

- **Trigger** `trigga_ny_post_logg` – automatiskt loggande vid ny post. Visar att databasen kan reagera på händelser.
- **Procedure** `hamta_poster_per_kategori` – databasnära analys. Visar att logik kan ligga i databasen.

### Index och prestanda

Index finns där appen filtrerar och joinar: Poster (AnvandarID, KategoriID, SkapadDatum), PostBegrepp (UNIQUE + idx på BegreppID), AktivitetLogg (PostID, Tidpunkt). Redundanta index har tagits bort. Se `docs/PRESTANDANALYS.md` för EXPLAIN och motivering.

### Säkerhet och integritet

- Parameteriserade frågor (inga SQL-injection via strängkonkatenering).
- Begränsat databaskonto via `grants.sql`.
- Constraints: NOT NULL, ENUM, UNIQUE, FOREIGN KEY, CHECK (titel får inte vara tom).

## Dokumentation

- `docs/DATABASE_HELP.md` – databasen förklarad (pedagogiskt)
- `docs/PRESTANDANALYS.md` – prestanda och index
- `docs/API_PLAN.md` – API-endpoints
- `frontend/public/runbook.md` – praktisk runbook för start, manuell användning och test
- `docs/STATUS.md` – projektstatus
- `docs/BEGREPP_LEXIKON.md` – begreppsbibliotek
