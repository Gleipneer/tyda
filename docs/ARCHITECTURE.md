# ARCHITECTURE.md
## Systemarkitektur – Reflektionsarkiv

**Databasdokumentation:** Se `docs/DATABASE_HELP.md` för pedagogisk förklaring av den faktiska 6-tabellsmodellen.

---

## 1. Systemarkitektur

```
[Frontend React + Vite]
         |
         | HTTP / JSON (fetch)
         v
[FastAPI Backend]
         |
         | mysql-connector-python
         v
[MySQL: reflektionsarkiv]
```

---

## 2. Lagerindelning

### Databaslager
- Lagring, relationer, constraints
- Trigger som loggar till AktivitetLogg vid ny post
- Stored procedure: `hamta_poster_per_kategori` (bonus)
- AktivitetLogg ska läsas som enkel poster-logg, inte som full auditlogg

### Backendlager
- `routers/` – HTTP-endpoints
- `repositories/` – SQL-frågor
- `schemas/` – Pydantic request/response
- `services/` – affärslogik, symbolmatchning (symbol_matcher.py)

### Frontendlager
- `pages/` – sidor
- `components/` – UI-komponenter
- `services/` – API-anrop
- `types/` – TypeScript-typer

---

## 3. Tabeller och relationer

| Tabell | Beskrivning | Relationer |
|--------|-------------|------------|
| Anvandare | Användare | → Poster |
| Kategorier | Posttyper (dröm, vision, etc) | → Poster |
| Poster | Kärninnehåll | → Anvandare, Kategori, PostBegrepp, AktivitetLogg |
| Begrepp | Ord/symboler (orm, vatten, tempel) | ↔ Poster via PostBegrepp |
| PostBegrepp | Koppling post–begrepp | → Poster, Begrepp |
| AktivitetLogg | Triggerlogg | → Poster, Anvandare |

---

## 4. Dataflöden

**Lista poster:** Frontend → GET /api/posts → JOIN Poster+Anvandare+Kategorier → JSON

**Skapa post:** Frontend → POST /api/posts → INSERT Poster → trigger skapar AktivitetLogg

**Post-detalj:** GET /api/posts/{id}, GET /api/posts/{id}/concepts, GET /api/posts/{id}/matched-concepts

**Automatisk symbolmatchning:** POST /api/analyze/text-concepts – Python mellanlager analyserar text, normaliserar, matchar mot Begrepp.

---

## 5. Trigger och aktivitetslogg

När en post skapas (INSERT i Poster) kör databasen en trigger som skriver en rad i AktivitetLogg. Backend exponerar detta via GET /api/activity.
