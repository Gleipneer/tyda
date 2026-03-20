# Backend – Tyda (FastAPI)

## Start (utveckling)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Kopiera `env.example` till `.env` och sätt `DB_PASSWORD` m.m.

## Databasmigrationer

- SQL-filer: `../database/migrations/`
- Körning: `python scripts/run_migration_utf8.py` (UTF-8, spårning i `schema_migrations`)

**Vid start från projektrot** körs migrationer automatiskt av `../scripts/start.ps1` / `start.sh` — du behöver normalt inte köra skriptet manuellt.

Flaggor: `--legacy-bootstrap`, `--mark-only` (se `../database/migrations/README.md`).

## API

- Hälsa: `GET /api/health`
- Databas: `GET /api/db-health`
