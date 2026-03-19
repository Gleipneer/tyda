# Ändringsplan – Reflektionsarkiv mot VG-kriterier

**Källor:** Namnlöst dokument.pdf, uppgiftslista, VG/YH_26_planering_databaser (1).pdf, docs/VG_ANALYS_OCH_ATERSTAENDE.md

---

## 1. Översikt

| Uppgift | Prioritet | Status | Påverkar |
|---------|-----------|--------|----------|
| Synlighet: Privat/Publik (ta bort Delad, byt Offentlig→Publik) | Normal | **KLAR** | DB, Backend, Frontend, Om Tyda |
| Kontorättigheter (Admin & användare) | Normal | Ej påbörjad | DB, Backend, dokumentation |
| Teckenräkning för titel | Normal | Ej påbörjad | Frontend |
| Indexering PostBegrepp | Normal | **KLAR** | Migration 012 |
| Admin: Kommentar TEXT | Normal | **KONFLIKT** | Kommentar togs bort i migration 011 |

---

## 2. Detaljerad ändringsstruktur

### 2.1 Synlighet: Privat och Publik (ta bort Delad)

**Krav:** PDF + uppgiftslista – "Ska bara ha Privat eller Publik som alternativ". "Byt frontend till Privat och Publik".

**Databas:**
- Ändra `Synlighet ENUM('privat', 'delad', 'publik')` → `ENUM('privat', 'publik')`
- Migration: `013_synlighet_privat_publik.sql`
- Uppdatera befintliga `delad`-rader till `publik` (eller `privat`) innan ENUM-ändring

**Backend (Python):**
- `backend/app/schemas/posts.py` – synlighet: `"privat" | "publik"`
- `backend/app/routers/posts.py` – validering: bara `privat`, `publik`
- `backend/app/repositories/post_repo.py` – ta bort `delad` från filter/where

**Frontend:**
- `VisibilityBadge.tsx` – ta bort `delad`, byt `publik` label till "Publik" (idag "Offentlig")
- `NewPostPage.tsx` – bara Privat/Publik, label "Publik" istället för "Offentlig"
- `MyRoomPage.tsx`, `PostsPage.tsx` – ta bort Delad-filter
- `types/posts.ts` – `Synlighet = "privat" | "publik"`
- `services/posts.ts` – uppdatera typ

**Om Tyda (AboutDatabasePage):**
- ER-diagram: Synlighet `privat`, `publik`
- Text: "Privat eller Publik" (inte Offentlig)
- SQL-exempel utan `delad`

**Övrig dokumentation:**
- `docs/DATABASE_HELP.md`, `README.md`, `runbook.md`, `VG_ANALYS_OCH_ATERSTAENDE.md`

---

### 2.2 Kontorättigheter (Admin & användare)

**Krav:** VG PDF – "Implementera en säkerhetsstrategi (t.ex. begränsa användarbehörigheter med GRANT och REVOKE)".

**Databas:**
- Skapa `database/scripts/grants.sql` med:
  - `CREATE USER` för app-användare (begränsad)
  - `GRANT SELECT, INSERT, UPDATE, DELETE` på tabeller
  - `REVOKE` på schema-ändringar
  - Eventuellt separat admin-användare för migrationer

**Backend:**
- Uppdatera `.env.example` med `DB_USER` för app-konto
- Dokumentera i README

**Dokumentation:**
- README: säkerhetsstrategi
- VG_ANALYS: uppdatera 4.10 till UPPFYLLT

---

### 2.3 Teckenräkning för titel

**Krav:** Uppgiftslista – "Teckenräkning. Lägga till för titel."

**Frontend:**
- `NewPostPage.tsx` – visa teckenräkning under titelfältet (t.ex. "0 / 150")
- `Poster.Titel` har `VARCHAR(150)` – max 150 tecken

**Anteckning:** "Behöver man räkna tecken och ord i Innehåll?" – Nej, kravet nämner bara titel.

---

### 2.4 Admin: Kommentar TEXT (KONFLIKT)

**Krav från PDF:** "i admin portal: kunna skapa, lägga till. Kunna se hela kommentarerna som finns om varje ord som databasen har hittat från Kommentar TEXT"

**Konflikt:** Kolumnen `Kommentar` togs bort från PostBegrepp i migration 011 (användarens beslut).

**Alternativ:**
- **A)** Återinför Kommentar + bygg admin UI för att se/skriva kommentarer
- **B)** Dokumentera att kravet inte uppfylls: "Kommentar togs bort som designval; admin visar i stället begreppskopplingar utan kommentar"

**Rekommendation:** B – behåll nuvarande modell, dokumentera i VG.

---

## 3. ER-diagram (Om Tyda)

Efter alla ändringar ska ER-diagrammet i AboutDatabasePage visa:

- **Poster:** Synlighet `privat`, `publik` (inte delad)
- **PostBegrepp:** PostBegreppID, PostID, BegreppID (ingen Kommentar)
- Relationer oförändrade

---

## 4. Agent-svärm – fördelning

| Agent | Uppgift | Filer |
|-------|---------|-------|
| **Agent 1** | Synlighet: DB migration + backend | migrations/, post_repo, posts router, schemas |
| **Agent 2** | Synlighet: Frontend + Om Tyda | NewPostPage, MyRoomPage, PostsPage, VisibilityBadge, AboutDatabasePage |
| **Agent 3** | Kontorättigheter | database/scripts/grants.sql, README, .env.example |
| **Agent 4** | Teckenräkning titel | NewPostPage.tsx |
| **Agent 5** | VG-validering + .md | VG/VG_KRITERIER_STATUS.md, VG/VG_ATERSTAENDE.md |

---

## 5. Validering efter ändringar

1. Starta om databasen: `DROP DATABASE` + `reflektionsarkiv.sql` + alla migrationer
2. Kör `pytest tests/test_database_truth.py`
3. Starta backend + frontend, testa:
   - Skapa post med Privat/Publik
   - Filtrera i Mitt rum
   - Teckenräkning på titel
4. Jämför mot VG PDF-kriterier
5. Skapa VG/VG_KRITERIER_STATUS.md och VG/VG_ATERSTAENDE.md
