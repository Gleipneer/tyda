# Repoöversikt – Tyda / Reflektionsarkiv

**Syfte:** Snabb navigering, start/Tailscale och arkitektur. Detaljerad status: `docs/STATUS.md`.

**Senast uppdaterad:** 2026-03-25

---

## 1. Starta systemet och nå det via Tailscale

### Rekommenderat flöde

1. **MySQL** måste köra och databasen `reflektionsarkiv` måste finnas (importera `reflektionsarkiv.sql` om den saknas).
2. **Backend:** `backend/.env` med `DB_*`, `JWT_SECRET` (se `backend/.env.example`).
3. **Migrationer:** från `backend/`: `./venv/bin/python scripts/run_migration_utf8.py`
4. **Startskript:** `./scripts/start.sh` (Windows: `scripts/start.ps1`).

### Tailscale / fjärråtkomst i utvecklingsläge

- **Frontend (Vite)** har `server.host: "::"` i `frontend/vite.config.ts`.
- **API:** relativ `/api` proxas till `http://127.0.0.1:8000` — öppna `http://<tailscale-ipv4>:5173` från annan nod (`tailscale ip -4` på värden).
- **Backend** kan ligga kvar på `127.0.0.1` tillsammans med proxyn.

### Vanliga miljöproblem (Linux)

- **MySQL `root` med `auth_socket`:** använd `sudo mysql < reflektionsarkiv.sql`, skapa användare med lösenord (t.ex. `database/scripts/grants.sql`), sätt `DB_USER` / `DB_PASSWORD` i `.env`. `start.sh` skriver nu en kort vägledning om TCP-inloggning mot root misslyckas.

---

## 2. Vad som är klart och fungerar bra

| Område | Kommentar |
|--------|-----------|
| **Stack** | FastAPI, React/Vite, MySQL. Python-version i `.python-version` (3.12). Endast **npm** (`package-lock.json`). |
| **API** | Health, auth med **JWT**, poster (ägarskap från token), begrepp, aktivitet, analyser, AI-tolkning (valfritt). |
| **Säkerhet** | Bcrypt-inloggning, GRANT-skript, skyddade skrivningar; se README och `docs/DATABASE_SAKERHET.md`. |
| **Tester** | Backend `pytest`, frontend Vitest + Playwright runtime. |

---

## 3. Tidigare åtgärdslista (från genomgång mars 2025)

Följande punkter från den ursprungliga genomgången är **adresserade**:

- JWT för skriv-API (poster, post–begrepp, interpret); `anvandar_id` på skapa post kommer från token.
- Dokumentationsdrift: `docs/STATUS.md` uppdaterad till migration 001–016; VG-filer harmoniserade; `docs/VERIFICATION_REPORT.md` utan klartextlösenord; `docs/VG_ANALYS_OCH_ATERSTAENDE.md` noterar detta.
- `scripts/start.sh`: tydligare feltext vid MySQL TCP/auth_socket.
- `frontend/bun.lock` borttagen; `README - kopia.md` borttagen.
- README: dokumentationsindex, symmetrisk Windows/Linux, JWT-dokumentation, `cp .env.example`.
- `.python-version` tillagd.
- AI-panel: tydligare meddelande när `OPENAI_API_KEY` saknas.

**Kvar som medveten begränsning / nästa steg:**

- Lexikon-CRUD (`/api/concepts` skriv) är öppet i demo — lås med admin-roll i produktion.
- `localStorage` för JWT — byt till cookies i hårdare miljöer.

---

## 4. Arkitektur i korthet

```
Browser → Vite (5173) → proxy /api → Uvicorn FastAPI (8000) → MySQL (reflektionsarkiv)
```

---

## 5. Snabbverifiering

```bash
curl -s http://127.0.0.1:8000/api/health
cd backend && ./venv/bin/pytest tests/ -q
```

API mot igång backend: `python scripts/verify_api.py` (från projektroten).

---

*För fullständigare historik och punktlistor, se `docs/STATUS.md` och `README.md`.*
