# Databasmigrationer – Tyda / Reflektionsarkiv

## Vad migrationerna gör

| Fil | Innehåll (kort) |
|-----|-----------------|
| `001`–`003` | Utökar `Begrepp` (lexikon för automatisk symbolmatchning i backend) |
| `004` | Känsla m.m. |
| `005` | Tar bort kommentarkolumner (om de fanns) |
| `006`–`008` | Ytterligare lexikon / precision för drömtolkning |
| `009` | Konsolidering (index, FK) |
| `010`–`012` | Förenklad `PostBegrepp`, index |
| `013` | Synlighet `privat`/`publik` |
| `014` | CHECK på titel |
| `015` | Auth-kolumner (`LosenordHash`, `ArAdmin`) – hoppas över om de redan finns |
| `016` | Trigger för uppdaterad post → `AktivitetLogg` – hoppas över om triggern finns |
| `017` | Material/kropp/staty (t.ex. brons, järn, lera, huvud, staty) för symbolisk text |

**Kör alltid via** `backend/scripts/run_migration_utf8.py` (inte `mysql < fil` på Windows utan UTF-8-hantering).

**Startskript:** `scripts/start.ps1` och `scripts/start.sh` anropar detta automatiskt vid varje start (efter att venv och npm är klara).

## Behöver jag köra om?

| Situation | Åtgärd |
|-----------|--------|
| Ny databas från `reflektionsarkiv.sql` (få begrepp) | **Ja**, kör migreringsskriptet en gång så lexikon och schema uppdateras. |
| Databas som redan körts igenom alla migrationer tidigare | **Nej** – skriptet hoppar över redan registrerade filer (tabellen `schema_migrations`). |
| Gammal DB utan spårning + fel vid omkörning (duplicate key) | Använd `--legacy-bootstrap` eller `--mark-only` (se nedan). |

## Kommando

Från katalogen **`backend`** (så att `.env` med DB-uppgifter laddas):

```powershell
cd backend
.\venv\Scripts\python.exe scripts\run_migration_utf8.py
```

Linux/macOS:

```bash
cd backend
source venv/bin/activate
python scripts/run_migration_utf8.py
```

### Valfria flaggor

| Flagga | Betydelse |
|--------|-----------|
| *(ingen)* | Kör alla migrationer som inte redan finns i `schema_migrations`. |
| `--mark-only` | Registrera **alla** kända migrationer som körda **utan** att köra SQL (används sällan; t.ex. efter manuell DB-fix). |
| `--legacy-bootstrap` | Om `schema_migrations` är tom men `Begrepp` redan är stort (≥ 80 rader), anta att lexikonet redan är inlagt och **registrera alla** migrationer utan att köra dem (undviker duplicate key på äldre installationer). |

## Tekniskt

- Tabellen **`schema_migrations`** skapas automatiskt av skriptet och lagrar vilka `.sql`-filer som körts.
- **Ordning** är fast i `run_migration_utf8.py` – ändra inte numrering utan att uppdatera skriptet.
- Basfilen `reflektionsarkiv.sql` innehåller bara **6** begrepp; full symbolmatchning kräver att migrationerna **001+** körts (eller motsvarande data).
