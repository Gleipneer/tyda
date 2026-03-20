# Kanonisk start (ren miljö → verifierad kedja)

1. MySQL igång. Skapa databas om den saknas: `mysql ... < reflektionsarkiv.sql` (eller låt `scripts/start.ps1` försöka).
2. **`backend/.env`** med `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
3. Från **`backend`**:  
   `python scripts/run_migration_utf8.py`  
4. Verifiera:  
   `python scripts/verify_chain.py` (exit 0, ≥5 träffar).
5. Start (Windows): **`.\scripts\start.ps1`** från projektroten — kör migrationer, backend `:8000`, frontend `:5173`.

**En rad efter repo + venv finns:**  
`cd backend && python scripts/run_migration_utf8.py && python scripts/verify_chain.py`
