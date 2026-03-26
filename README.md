# Reflektionsarkiv

Webbapplikation ovanpå databasen `reflektionsarkiv`. Användare kan skriva poster, koppla begrepp, se automatchade symboler och (valfritt) få AI-tolkning av drömmar.

**Joakim Emilsson – YH24**

## Stack

- **Backend:** Python 3.12 (se `.python-version`), FastAPI, MySQL (mysql-connector-python)
- **Frontend:** React, Vite, TypeScript (pakethantering: **npm**; `package-lock.json` är canonical)
- **Databas:** MySQL (reflektionsarkiv)

## Dokumentation — var börjar jag?

| Behov | Fil |
|--------|-----|
| Aktuell demo-/funktionsstatus | `docs/STATUS.md` |
| Snabb repoöversikt och Tailscale-tips | `REPO_OVERSIKT.md` |
| Steg-för-steg ny i projektet | `KOMPANJON.md` |
| Arkitektur, API-plan, byggordning | `docs/ARCHITECTURE.md`, `docs/API_PLAN.md`, `docs/BUILD_ORDER.md` |
| VG-kriterier (kurs) | `VG/VG_KRITERIER_STATUS.md` (primär), `VG/VG_ATERSTAENDE.md` (kompletterande) |
| Cursor-/agentinstruktioner (planering) | `start.md`, `Planering.md` |

## Starta projektet

**Snabbstart (efter första gångens setup):** Kör från projektroten:

**Windows (PowerShell):**

```powershell
.\scripts\start.ps1
```

**macOS / Linux:**

```bash
chmod +x scripts/start.sh   # första gången
./scripts/start.sh
```

Skriptet frigör port 8000 och 5173 om de är upptagna, startar backend i bakgrunden och frontend i förgrunden. Backend: http://127.0.0.1:8000, Frontend: http://localhost:5173 (Vite lyssnar på alla gränssnitt — se `REPO_OVERSIKT.md` för Tailscale).

---

**Manuell start (viktig ordning):** Databas → Backend (kör migrationer automatiskt vid uppstart) → Frontend.

### 1. Databas

Se till att MySQL körs. Skapa databasen (på Ubuntu med `auth_socket` för root: `sudo mysql < reflektionsarkiv.sql`):

```bash
mysql -u root -p < reflektionsarkiv.sql
```

### 2. Migrationer (valfritt manuellt)

Vid `uvicorn app.main:app` körs alla `database/migrations/*.sql` i ordning innan API:t tar emot trafik (idempotent). Du kan också köra samma kedja manuellt från `backend/`:

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
cp .env.example .env
# Redigera .env: DB_PASSWORD, JWT_SECRET (se .env.example)

uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Öppna http://localhost:5173

### Autentisering (JWT)

Efter `POST /api/auth/login` eller `POST /api/users` returneras `access_token` (Bearer JWT). Frontend sparar token i `tyda.session` och skickar `Authorization: Bearer …` på skyddade anrop.

Skrivskyddat API (kräver giltig JWT): skapa/uppdatera/radera poster, koppla/ta bort begrepp på post, AI-tolkning. Postens ägare hämtas från token — inte från klientfält.

### Valfritt: AI-tolkning

Lägg `OPENAI_API_KEY=sk-...` i `backend/.env` för att aktivera AI-tolkning på postdetaljsidan. Nyckeln används endast server-side och exponeras aldrig i frontend.

## Frontend just nu

- Navigationen är mobile-first: toppnavigation på större skärmar och menyknapp på smalare vyer.
- Inloggning på startsidan ger JWT; session (användare + token) sparas i `localStorage`. Byt användare via `Byt användare` i header eller meny.
- Skrivflödet ligger i `Ny post`: titel, innehåll, kategori och synlighet. Utkast sparas lokalt per aktiv användare.
- Kategori väljs vid skapande av posten. UI:t använder `Privat` och `Publik`; i databasen/API:t finns värdena `privat` och `publik`.
- AI-tolkning körs från postdetaljen och har nu modellval i UI:t. Frontend hämtar tillåtna modeller från backend och skickar vald modell till interpret-endpointen.
- Databasen är fortfarande avsiktligt liten: 6 tabeller, 2 triggers, 1 lagrad procedur. Automatisk matchning och AI-tolkning ligger främst i backend, inte i schemat.
- Testbarheten bygger just nu främst på stabila routes, roller/labels/placeholders och runtime-testet för ny-post-flödet i `frontend/e2e-runtime/newpost-runtime.spec.ts`.

## API

- `GET /api/health` – backend igång
- `GET /api/db-health` – databasanslutning
- `POST /api/auth/login` – inloggning; svar: `access_token`, `user` (se `docs/INLOGGNING_DEMO.md`)
- `POST /api/users` – skapa konto; svar: `access_token`, `user`
- `GET /api/users/{id}` – en användare
- `GET /api/categories` – kategorier
- `GET /api/posts` – poster (filtrering `?anvandar_id=` kräver Bearer som samma användare)
- `POST /api/posts` – skapa post (Bearer; ägare = inloggad användare)
- `POST /api/posts/{id}/interpret` – AI-tolkning (Bearer + OPENAI_API_KEY)
- m.fl. (se docs/API_PLAN.md)

## Säkerhetsstrategi

Databasen följer **least privilege**: applikationen ska använda `reflektionsarkiv_app` med begränsade rättigheter. Skriptet `database/scripts/grants.sql` gör i korthet:

1. **`REVOKE ALL PRIVILEGES`** på `reflektionsarkiv.*` för app-användaren (nollställer gamla/överblivna rättigheter).
2. **`GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE`** – ingen DDL (CREATE/DROP/ALTER-tabeller) för appkontot.
3. **Valfritt:** `reflektionsarkiv_admin` med `ALL PRIVILEGES` på *endast* databasen `reflektionsarkiv` – för migrationer/schema utan att använda root (om du vill).

**Körordning:** skapa databas/tabeller först (`reflektionsarkiv.sql` eller `reset_database.py`), *sedan*:

```bash
mysql -u root -p < database/scripts/grants.sql
```

**Fördjupning (GRANT, REVOKE, hur du loggar in som admin, varför det inte finns webb-adminportal i Tyda):** se [`docs/DATABASE_SAKERHET.md`](docs/DATABASE_SAKERHET.md).

## Reflektion – databasval och design

### Varför MySQL / relationsdatabas

Projektet använder en relationsdatabas (MySQL) eftersom datan är strukturerad: användare, poster, kategorier, begrepp och kopplingar mellan dem. Relationsmodellen med primärnycklar, främmande nycklar och JOIN:s passar väl. NoSQL (t.ex. dokument- eller nyckelvärdesdatabas) hade krävt mer applikationslogik för relationer som redan löses enkelt i SQL.

### Varför denna tabellstruktur

- **Anvandare, Kategorier, Poster, Begrepp** – separata tabeller för återanvändning och normalisering.
- **PostBegrepp** – kopplingstabell för många-till-många mellan Poster och Begrepp. En post kan ha många begrepp, ett begrepp kan finnas i många poster. UNIQUE(PostID, BegreppID) hindrar dubbletter.
- **AktivitetLogg** – enkel logg separat från postdatan. Triggarna skriver vid ny post respektive när titel, innehåll, synlighet eller kategori ändras.

### Varför Synlighet bara är privat och publik

Tidigare fanns `delad` som tredje alternativ. Det togs bort för att förenkla: användaren behöver veta om posten är privat (bara i mitt rum) eller publik (synlig i Utforska). Två tydliga lägen räcker för kursnivån.

### Varför PostBegrepp saknar Kommentar

Kolumnen Kommentar togs bort som designval. Ingen UI använde den, och modellen blev enklare. Manuella begreppskopplingar sparas utan kommentar.

### Varför triggarna och proceduren finns

- **Trigger** `trigga_ny_post_logg` – loggning vid ny post.
- **Trigger** `trigga_post_uppdaterad_logg` – loggning vid uppdatering som ändrar titel, innehåll, synlighet eller kategori.
- **Procedure** `hamta_poster_per_kategori` – databasnära analys. Visar att logik kan ligga i databasen.

**Säkerhetskopia:** se [`docs/BACKUP.md`](docs/BACKUP.md) och `database/scripts/backup.ps1`.

### Index och prestanda

Index finns där appen filtrerar och joinar: Poster (AnvandarID, KategoriID, SkapadDatum), PostBegrepp (UNIQUE + idx på BegreppID), AktivitetLogg (PostID, Tidpunkt). Redundanta index har tagits bort. Se `docs/PRESTANDANALYS.md` för EXPLAIN och motivering.

### Säkerhet och integritet

- Parameteriserade frågor (inga SQL-injection via strängkonkatenering).
- Inloggning: `POST /api/auth/login` jämför lösenord mot **bcrypt-hash** i `Anvandare.LosenordHash`. Demo-konton: `docs/INLOGGNING_DEMO.md`.
- Begränsat databaskonto via `grants.sql`.
- Constraints: NOT NULL, ENUM, UNIQUE, FOREIGN KEY, CHECK (titel får inte vara tom).
- **JWT:** Skrivoperationer på poster och post–begrepp kräver Bearer-token från inloggning. För produktion: stark `JWT_SECRET`, kortare livslängd och helst httpOnly-cookies istället för `localStorage`.

## Dokumentation

- `docs/DATABASE_SAKERHET.md` – GRANT/REVOKE, MySQL-admin vs appanvändare, ingen adminportal
- `docs/DATABASE_HELP.md` – databasen förklarad (pedagogiskt)
- `docs/PRESTANDANALYS.md` – prestanda och index
- `docs/API_PLAN.md` – API-endpoints
- `frontend/public/runbook.md` – praktisk runbook för start, manuell användning och test
- `docs/STATUS.md` – projektstatus
- `docs/BEGREPP_LEXIKON.md` – begreppsbibliotek
