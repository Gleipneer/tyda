# PROJECT_PLAN.md
## Reflektionsarkiv – projektplan

**Projektägare:** Joakim Emilsson  
**Sanningskälla:** `planering.md` i root + den verkliga databasen  
**Databasdokumentation:** `docs/DATABASE_HELP.md` (6-tabellsmodell)  
**Uppdaterad:** 2025-03-16

---

## 1. Kort beskrivning

Reflektionsarkiv är en webbapplikation ovanpå relationsdatabasen `reflektionsarkiv`. Användare kan skriva poster (drömmar, visioner, reflektioner), tilldela kategorier och koppla begrepp. Systemet visar aktivitetslogg och enkel analys.

**Ny princip (2025-03-15):** Databasen förblir enkel. Mellanlagret i Python står för intelligent symbolmatchning – systemet reagerar automatiskt på text och visar relevanta begrepp. Frontend presenterar detta enkelt för användaren.

---

## 2. Teknisk stack

| Lager | Teknik |
|-------|--------|
| Backend | Python 3.12+, FastAPI, mysql-connector-python, Pydantic, Uvicorn |
| Frontend | React + Vite, enkel CSS eller Tailwind |
| Databas | MySQL (redan skapad) |

---

## 3. Kärnfunktioner (MVP)

- Visa alla poster
- Skapa ny post
- Läsa post i detalj
- Visa och koppla begrepp till poster
- Se kategorier
- Se aktivitetslogg (trigger)
- Köra enkel analysvy

---

## 4. Avgränsningar

**Bygger inte:**
- AI-tolkning / LLM
- Avancerad autentisering
- Mobilapp
- Storytel-klon

**Bygger:**
- Tydlig CRUD ovanpå databasen
- Pedagogiskt, begripligt system

---

## 5. Arkitekturöversikt

```
[Frontend React]
       |
       | HTTP / JSON
       v
[FastAPI Backend]
       |
       | SQL
       v
[MySQL: reflektionsarkiv]
```

---

## 6. Byggordning (hög nivå)

1. Backend bootstrap + db-health
2. Users, Categories, Posts (GET)
3. Frontend bootstrap + postlista
4. Create post
5. Post detail, Concepts
6. Activity log, Analytics
7. Edit/Delete, Polish

---

## 7. MVP vs bonus

| MVP | Bonus |
|-----|-------|
| Alla CRUD för poster, begrepp | Highlight av begrepp i text |
| Aktivitetslogg i UI | Stored procedure med datumintervall |
| Analysvy | |
| **Automatisk symbolmatchning** (ny) | |

---

## 8. Operativ sanningskälla

- **Planering:** `planering.md` (root)
- **Implementation:** `docs/BUILD_ORDER.md`, `docs/API_PLAN.md`
- **Status:** `docs/STATUS.md`
