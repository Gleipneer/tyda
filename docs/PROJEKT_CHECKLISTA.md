# Planeringschecklista – status

Sammanställning av punkter från projektplaneringen och vad som är gjort i repot.

| Punkt | Status | Kommentar |
|-------|--------|-----------|
| **Kontorättigheter och lösenord** | ✅ | `Anvandare.LosenordHash`, `ArAdmin`, `POST /api/auth/login`, bcrypt. Migration 015 + `docs/INLOGGNING_DEMO.md`. Begränsade rättigheter: `database/scripts/grants.sql`, `docs/DATABASE_SAKERHET.md`. |
| **Synlighet: bara Privat / Publik** | ✅ | `ENUM('privat','publik')`, migration 013. UI och API utan `delad`. |
| **Teckenräkning titel** | ✅ | `VARCHAR(150)`, CHECK, frontend `maxLength` + räknare på ny-post-sidan. |
| **Tecken/ord i innehåll** | ✅ (valfritt UI) | Ny post visar ord- och teckenräkning för innehåll — bra för användaren; databasen begränsar inte TEXT-längd. |
| **PostBegrepp-index** | ✅ | Redundant `idx_postbegrepp_post` bort (012). Kvar: UNIQUE(PostID,BegreppID) + `idx_postbegrepp_begrepp`. Tester i `test_database_truth.py`. |
| **Aktivitetslogg utökad** | ✅ | `trigga_post_uppdaterad_logg` (016): logg vid ändring av titel, innehåll, synlighet eller kategori. |
| **Backup** | ✅ | `docs/BACKUP.md`, `database/scripts/backup.ps1`. |

## Migrationer efter 015

- `016_add_poster_update_trigger.sql` – trigger för uppdateringslogg.

## Tester

- Backend: `cd backend && pytest tests/test_database_truth.py -q`
- E2E (kräver igång server): se `frontend/e2e-runtime/`

## Kända begränsningar (produktion)

- JWT lagras i `localStorage`; för hårdare säkerhet överväg httpOnly-cookies, kortare tokenlivslängd och roterande `JWT_SECRET`.
- Globalt begrepps-CRUD (`POST/PUT/DELETE /api/concepts`) är fortfarande oskyddat i demo-läge; i produktion bör endast admin (t.ex. `ArAdmin`) få ändra lexikonet.
