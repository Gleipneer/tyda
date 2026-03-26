# Verifieringsrapport – Reflektionsarkiv

**Datum:** 2025-03-15  
**Pass A + B genomfört**

---

## 1. ROOT CAUSE – Bad Gateway

**Orsak:** Backend körde med gammal konfiguration (innan `DB_PASSWORD` lades till i `.env`). Databasanslutningen misslyckades, alla DB-endpoints returnerade 500. Vite-proxyn vidarebefordrade till backend som returnerade fel – vilket i vissa fall visades som "Bad Gateway" i frontend.

**Åtgärd:**
1. Backend startades om från `backend/` med korrekt `.env` (lösenord i `.env` — aldrig i versionskontrollerad dokumentation)
2. Proxy-target i `vite.config.ts` ändrad till `http://127.0.0.1:8000` (tydligare IPv4)
3. Frontend startades om för att ladda ny proxy-konfiguration

---

## 2. VERIFIERAT FUNGERANDE ENDPOINTS

| Endpoint | Status |
|----------|--------|
| GET /api/health | OK |
| GET /api/db-health | OK (database: connected) |
| GET /api/users | OK – 3 användare från DB |
| GET /api/categories | OK |
| GET /api/posts | OK – 6 poster från DB |
| GET /api/posts/{id} | OK |
| POST /api/posts | OK |
| GET /api/concepts | OK |
| GET /api/posts/{id}/concepts | OK |
| POST /api/posts/{id}/concepts | OK |
| GET /api/activity | OK |
| GET /api/analytics/* | OK |

---

## 3. BEVIS – DATA FRÅN DATABASEN

**Användare (GET /api/users):**
- Joakim Emilsson, Anna Svensson, Elias Holm

**Poster (GET /api/posts):**
- Dröm om orm i tempel, Reflektion om rädsla, Tanke om vatten, Dröm om eld, Vision av resa, Kort dikt om natt

**Databas:** `reflektionsarkiv` – 3 användare, 6 poster, kategorier, begrepp, aktivitetslogg.

---

## 4. UI-FÖRBÄTTRINGAR (PASS B)

- **Globala stilar:** Ny `index.css` – tydligare typografi, färger, spacing
- **Layout:** Uppdaterad padding, max-width för innehåll
- **Sidebar:** Justerad bredd, tydligare hover/active
- **PostCard:** Förbättrad kortlayout, hover-effekt, bättre hierarki
- **PostList:** Tydligare loading/error/empty states
- **Felmeddelanden:** Specifikt meddelande vid Bad Gateway – "Backend svarar inte – kontrollera att backend körs på port 8000"
- **PostsPage:** Ny header med knapp, CSS-fil
- **PostForm:** Förbättrad fokus-styling, spacing
- **PostDetailPage:** Kortlayout för artikel och sektioner, tydligare loading/error
- **Dashboard:** Fler statistik-kort (poster, användare, begrepp), loading-state

---

## 5. SLUTDOM

**READY TO DEMO** – Backend, databas och frontend fungerar. UI är uppdaterat och mer användarvänligt.
