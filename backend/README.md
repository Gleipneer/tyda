# Backend — mellanlager för Reflektionsarkiv

Joakim Emilsson – YH25  
Martin Fält – YH25  

Den här mappen är **backenden** i vårt projekt: ett **API-lager i Python** som ligger mellan webbgränssnittet (frontend) och databasen MySQL.  
Här finns ingen användargränssnittskod — bara logik, säkerhet och anrop mot databas och (valfritt) AI.

---

## Kort beskrivning

Backenden fungerar som **mellanlager mellan frontend och databasen**.  
Frontend pratar med backend via **HTTP** (REST-liknande endpoints under `/api/...`). Backend pratar med MySQL med **mysql-connector-python** och returnerar oftast **JSON**.

På så sätt slipper frontend prata direkt med databasen, och vi kan samla regler, validering och säkerhet på ett ställe.

---

## Vad backend gör i systemet

- **Läser och skriver data** i databasen `reflektionsarkiv`: användare, poster, kategorier, begrepp, aktivitetslogg med mera.  
- **Loggar in användare** och skickar tillbaka en **JWT** som frontend sparar och skickar med på skyddade anrop.  
- **Skyddar känsliga operationer** (t.ex. skapa/ändra/radera poster, koppla begrepp, AI-tolkning) så att bara inloggade användare (och ibland admin) får göra dem.  
- **Matchar text mot begreppslexikonet** server-side och kan använda det som underlag till bl.a. AI-tolkning.  
- **Kör databasmigrationer** vid uppstart så att schemat och lexikonet hänger ihop med koden (idempotent — samma start kan köras flera gånger).  
- **Erbjuder hälsokollar** (`/api/health`, `/api/db-health`) så man snabbt ser att tjänsten och databasen svarar.

---

## Teknikval

Vi använder **FastAPI** (inte Flask) som webbramverk.

**Varför FastAPI och Python här?**

- Vi ville ha ett **tydligt API-lager** som är lätt att läsa och att bygga vidare på.  
- FastAPI ger **tydliga routes**, inbyggd **validering** med Pydantic och bra stöd för **async** där det behövs.  
- Vi känner oss hemma i **Python** för backendlogik, tester och skript — samma språk som vi använder för migrationsskript och automatiska tester.

**Varför inte lägga allt i frontend?**  
Då skulle databaslösenord och affärsregler hamna i webbläsaren, vilket är **osäkert** och svårt att styra. Backend håller hemligheter och regler **server-side**.

**Varför inte lägga allt direkt i databasen?**  
En del logik ligger i databasen (triggers, lagrad procedur), men **användargränssnitt, JWT och AI-anrop** hör hemma i applikationen ovanpå — inte som enda lager i SQL.

Själva serverprocessen startar vi med **Uvicorn**, som kör FastAPI-appen (`app.main:app`).

---

## Hur dataflödet fungerar

1. Användaren arbetar i **React/Vite-frontend** (egen mapp i repot).  
2. Frontend anropar t.ex. `GET /api/posts` eller `POST /api/posts` mot backend (i utveckling proxas `/api` ofta via Vite till `http://127.0.0.1:8000`).  
3. Backend använder **repositories** (dataåtkomst) och **routers** (HTTP) för att läsa/skriva i MySQL.  
4. Svaret går tillbaka som **JSON** till frontend som visar det i gränssnittet.

Databasen är fortfarande **kärnan** i uppgiften; backend är lagret som gör den användbar och säker i ett riktigt system.

---

## Inloggning och säkerhet (JWT)

**JWT** (JSON Web Token) är en **krypterad/signatur-baserad nyckel** som backend skapar efter lyckad inloggning.  
Frontend skickar den tillbaka i headern `Authorization: Bearer <token>`.

**Vad JWT gör praktiskt hos oss:**

- Backend kan se **vem som är inloggad** utan att lagra session i databas för varje klick.  
- Vi kan **skydda endpoints** med `Depends(get_current_user_id)` så att bara rätt användare t.ex. ändrar sina egna poster.  
- **Lösenord** lagras inte i klartext; hashning sker server-side (se `app/security.py` och användartabellen).

JWT-hemligheten (`JWT_SECRET`) och databaslösenord står bara i **`backend/.env`** (som **inte** ska committas). Mall finns i **`backend/.env.example`**.

---

## Vad API:t gör

API:t är en samling **HTTP-endpoints** under prefixet `/api`, till exempel:

- **Hälsa:** `GET /api/health`, `GET /api/db-health`  
- **Auth / användare:** inloggning, registrering, användarprofil  
- **Poster, kategorier, begrepp:** CRUD och kopplingar  
- **Aktivitet / analys:** läsning av logg och viss statistik  
- **AI-tolkning:** se nästa avsnitt  

Listan ovan är inte fullständig — se koden i `app/routers/` för exakta paths och metoder.

---

## AI-tolkning via backend

AI-tolkningen är **valfri**. Den anropas från frontend, men **OpenAI-nyckeln** (`OPENAI_API_KEY`) läses **bara i backend** från miljövariabler — den skickas **aldrig** till webbläsaren.

Flöde i korthet:

1. Inloggad användare begär tolkning för en post.  
2. Backend hämtar posten och ev. automatchade begrepp, bygger en **prompt** enligt vårt **tolkningskontrakt** (t.ex. dröm vs reflektion).  
3. Backend anropar OpenAI via vår wrapper (`app/services/openai_interpret_chat.py`).  
4. Svaret struktureras till **sektioner** (JSON) och kan efterbearbetas lite för kvalitet (`interpret_postprocess`).  
5. Frontend visar sektionerna i en egen vy.

Om nyckel saknas svarar backend med tydligt fel (t.ex. att tjänsten inte är konfigurerad).

---

## Migrationer

SQL-filer ligger i repots mapp **`database/migrations/`** (numrerade `001_...sql`, `002_...`, osv.).

När backend startar körs funktionen **`run_all_migrations`** (se `app/migrations_runner.py`) **innan** API:t börjar ta emot trafik. Det gör att lexikon, kolumner och annat som tillkommit i projektet finns i databasen utan manuella steg i normal utveckling.

Man kan också köra samma kedja manuellt:

```bash
cd backend
python scripts/run_migration_utf8.py
```

(UTF-8 via Python i stället för att pipa SQL genom `mysql` på Windows där teckenuppsättning lätt strular.)

---

## Hur man startar backend

**Förutsättningar:** Python (se `.python-version` i repots rot), MySQL igång, databas importerad enligt root-`README.md`, och `backend/.env` skapad från `backend/.env.example`.

```bash
cd backend
python -m venv venv
# Aktivera venv (Windows / Mac / Linux skiljer sig åt)
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

I praktiken startar vi ofta **hela systemet** (backend + frontend) från projektroten med `scripts/start.sh` eller `scripts/start.ps1` — se root-`README.md`.

Kontrollera att det lever: `http://127.0.0.1:8000/api/health`

---

## Kort slutsats

Backend är vårt **FastAPI-baserade mellanlager**: det skyddar databasen, hanterar **JWT**, exponerar ett **tydligt API** för React-frontend och tar hand om **valfri AI-tolkning** och **migrationer** på ett sätt som är lätt att förstå och bygga vidare på.

Om något är oklart: börja i `app/main.py` (hur appen och routers sätts ihop) och sedan `app/routers/` för vad som faktiskt går att anropa.
