# BUILD_ORDER.md
## Byggordning – Reflektionsarkiv

Varje fas: mål → filer → verifiering → done.

---

## Fas 0 – Projektstruktur
**Mål:** Backend- och frontend-mappar.

**Skapa:**
- backend/app/, routers/, repositories/, schemas/
- frontend/ (React + Vite)

**Done:** Båda projekt kan startas som tomma skal.

---

## Fas 1 – Backend startar
**Mål:** FastAPI svarar.

**Bygg:** main.py, GET /api/health

**Done:** `{"status":"ok"}`

---

## Fas 2 – Databasanslutning
**Mål:** Backend pratar med MySQL.

**Bygg:** config.py, db.py, .env.example, GET /api/db-health

**Done:** db-health returnerar connected.

---

## Fas 3 – Users och Categories
**Mål:** Första dataläsning.

**Bygg:** routers/users.py, categories.py, repositories, schemas

**Endpoints:** GET /api/users, /users/{id}, POST /api/users, GET /api/categories, /categories/{id}

**Done:** Riktig data från databasen.

---

## Fas 4 – Posts read
**Mål:** Lista och detalj för poster.

**Bygg:** routers/posts.py, post_repo.py, schemas/posts.py

**Endpoints:** GET /api/posts, GET /api/posts/{id}

**Done:** Poster med användare och kategori.

---

## Fas 5 – Frontend bas
**Mål:** Frontend visar poster.

**Bygg:** App shell, Sidebar, PostsPage, PostList, PostCard, api.ts

**Done:** Poster syns i UI.

---

## Fas 6 – Create post
**Mål:** Skapa post från UI.

**Bygg:** POST /api/posts, NewPostPage, PostForm

**Done:** Post sparas, trigger skapar logg.

---

## Fas 7 – Post detail
**Mål:** Detaljvy för post.

**Bygg:** PostDetailPage

**Done:** Klick till detalj fungerar.

---

## Fas 8 – Concepts
**Mål:** Begrepp och koppling till poster.

**Bygg:** CRUD concepts, GET/POST/DELETE post-concepts, ConceptList, ConceptPicker

**Done:** Begrepp kopplas till poster.

---

## Fas 9 – Activity log
**Mål:** Visa trigger i UI.

**Bygg:** GET /api/activity, ActivityPage, ActivityTable

**Done:** Nya poster ger synlig logg.

---

## Fas 10 – Analytics
**Mål:** Analysvy.

**Bygg:** Analytics-endpoints, AnalyticsPage, StatsCards

**Done:** Statistik visas.

---

## Fas 11 – Edit/Delete
**Mål:** Slutföra CRUD.

**Bygg:** PUT/DELETE posts, PUT/DELETE concepts, UI för edit/delete

**Done:** CRUD komplett.

---

## Fas 12 – Bonus (om tid)
**Mål:** Ordmatchning.

**Bygg:** POST /api/analyze/text-concepts, enkel UI

---

## Fas 13 – Polish
**Mål:** Lugnt, tydligt, demo-klart.

**Bygg:** Loading, empty states, felmeddelanden, spacing

**Done:** System känns färdigt.
