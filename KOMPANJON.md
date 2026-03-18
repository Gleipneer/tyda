# KOMPANJON.md

Snabbguide for dig som klonat `tyda` och vill fa igang projektet pa din egen dator.

## Kortversion

1. Klona repot.
2. Oppna en terminal i projektroten.
3. Kor startskriptet:

```powershell
.\scripts\start.ps1
```

Om allt finns installerat och dina databasuppgifter fungerar kommer skriptet att:

- skapa `backend/.env` fran `backend/.env.example` om den saknas
- skapa Python-venv om den saknas
- installera backendpaket om de saknas eller har andrats
- installera frontendpaket om de saknas eller har andrats
- skapa databasen fran `reflektionsarkiv.sql` om den saknas
- kora migrationerna
- starta backend pa `http://127.0.0.1:8000`
- starta frontend pa `http://localhost:5173`

## Du behover detta installerat

- Python 3.11 eller nyare
- Node.js 20 eller nyare
- npm
- MySQL
- `mysql`-klienten i PATH

## Forsta gangen: kontrollera `backend/.env`

Skriptet skapar `backend/.env` automatiskt om den inte finns, men du kan behova fylla i ratt databasuppgifter.

Fil:

```text
backend/.env
```

Viktigast:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=reflektionsarkiv
DB_USER=root
DB_PASSWORD=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Om din MySQL har losenord maste `DB_PASSWORD` sattas.

## Exakt startkommando

Sta i projektroten och kor:

```powershell
.\scripts\start.ps1
```

Om du redan ar i ratt mapp ar det det enda kommando du ska prova forst.

## Om du far fel

### 1. "Hittar inte Python"

Installera Python och prova igen.

### 2. "Hittar inte npm"

Installera Node.js och prova igen.

### 3. "mysql-klienten hittades inte"

Installera MySQL-klienten eller se till att `mysql` finns i PATH.

### 4. "Backend nar databasen inte"

Kontrollera:

- att MySQL faktiskt kor
- att `backend/.env` har ratt `DB_USER`
- att `backend/.env` har ratt `DB_PASSWORD`

### 5. Databasen skapas inte automatiskt

Kor da detta manuellt:

```powershell
mysql -u root -p < reflektionsarkiv.sql
cd backend
.\venv\Scripts\python.exe scripts\run_migration_utf8.py
```

Byt `root` till ditt eget MySQL-konto om du anvander ett annat.

## Nar allt fungerar

Du ska kunna oppna:

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/db-health`
- `http://localhost:5173`

## Om du bara vill starta om efter att allt redan ar installerat

Kor igen:

```powershell
.\scripts\start.ps1
```
