# STATUS.md
## Projektstatus – Reflektionsarkiv

**Senast uppdaterad:** 2026-03-18

**Databasdokumentation:** `docs/DATABASE_HELP.md` – pedagogisk förklaring. Informationssida i frontend: `/about`.

---

## Dokumentation uppdaterad för aktuella frontend-pass

- Dokumentationen speglar nu den pågående mobile-first-korrigeringen: toppnavigation på större skärmar och meny/drawer på smalare vyer.
- Dokumentationen speglar även testability-tillägget: stabila routes, tillgängliga labels/placeholders och runtime-verifiering av `Ny post`.
- Ny praktisk runbook finns i `frontend/public/runbook.md` och länkas från frontend.

---

## Verifierat fungerande

- [x] Backend, health, db-health
- [x] Users, Categories, Posts, Concepts, Activity, Analytics
- [x] POST /api/analyze/text-concepts
- [x] GET /api/posts/{id}/matched-concepts
- [x] POST /api/posts/{id}/interpret (AI-tolkning, kräver OPENAI_API_KEY)
- [x] GET /api/interpret/status
- [x] Begreppsbiblioteket är utökat via migration 001–008
- [x] Symbolmatcher med kluster, synonymer, böjningsformer
- [x] Frontend: Begrepp i fokus, auto-match, AI-tolkning på postdetalj
- [x] Frontend: aktiv användare i localStorage, `Byt användare`, lokala utkast per användare
- [x] Frontend: mobile-first navigation med drawer på smala vyer
- [x] Frontend: runtime-test för ny-post-flödet finns i `frontend/e2e-runtime/newpost-runtime.spec.ts`
- [x] ER-/databassidan är uppdaterad mot aktuell SQL-modell och beskriver AktivitetLogg som enkel poster-logg, inte full auditlogg

---

## Databas

- 6 tabeller: Anvandare, Kategorier, Poster, Begrepp, PostBegrepp, AktivitetLogg
- Trigger vid ny post -> AktivitetLogg
- Lagrad procedur: hamta_poster_per_kategori
- Migrationer: 001–009
- Redundanta index på `Anvandare.Epost` och `Begrepp.Ord` är borttagna; aktivitetsloggen har i stället index som matchar verkliga querymönster
- Delete-strategin är nu explicit: postkopplingar och aktivitetslogg rensas via cascade när en post tas bort

---

## Slutdom

**READY TO DEMO** – Komplett system med databas, API, frontend, symbolmatchning och valfri AI-tolkning, nu med truth-passad datamodell, sannare ER-/DB-sida och uppdaterad runbook/status.
