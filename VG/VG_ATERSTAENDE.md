# VG – Återstående för att nå full VG-nivå

**Detta som återstår för att stärka VG-försvaret.**

---

## 1. Säkerhetsstrategi (GRANT/REVOKE)

**Krav:** "Implementera en säkerhetsstrategi (t.ex. begränsa användarbehörigheter med GRANT och REVOKE om det finns användare)."

**Åtgärd:**
- Skapa `database/scripts/grants.sql` med:
  - `CREATE USER 'reflektionsarkiv_app'@'localhost' IDENTIFIED BY '...'`
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON reflektionsarkiv.* TO 'reflektionsarkiv_app'`
  - `REVOKE` på DROP, CREATE, ALTER
- Dokumentera i README
- Uppdatera `.env.example` med app-användare

**Motivering om det INTE görs:** Projektet använder ett enda databaskonto. För kursnivå kan detta motiveras med att det är en lokal utvecklingsmiljö; för produktion krävs least-privilege.

---

## 2. CHECK-constraint ✅ KLAR

**Krav:** "Säkerställ dataintegritet genom constraints (NOT NULL, CHECK, DEFAULT, FOREIGN KEY)."

**Åtgärd:** Migration 014 lade till `chk_poster_titel_nonempty CHECK (CHAR_LENGTH(Titel) > 0)` på Poster.Titel.

---

## 3. README-reflektion ✅ KLAR

**Krav:** "Motivera dina val av databasstruktur och säkerhetsåtgärder i en skriftlig reflektion i README.md."

**Åtgärd:** README har sektion "Reflektion – databasval och design" med motivering för MySQL, tabellstruktur, PostBegrepp, Synlighet, Kommentar, trigger, procedure, index och säkerhet.

---

## 4. Prestanda – EXPLAIN-dokumentation ✅ KLAR

**Krav:** "Analysera databasens prestanda och redogör för optimeringsmöjligheter (t.ex. indexering)."

**Åtgärd:** `docs/PRESTANDANALYS.md` skapad med EXPLAIN-frågor, indexstrategi och förklaring av borttaget idx_postbegrepp_post.

---

## 5. Kommentar TEXT – varför det INTE uppfylls

**Krav från Namnlöst dokument:** "Admin portal: kunna se hela kommentarerna som finns om varje ord från Kommentar TEXT."

**Beslut:** Kolumnen Kommentar togs bort från PostBegrepp (migration 011) som designval – ingen UI använde den, ingen koppling till andra tabeller. Admin kan i stället se och hantera begreppskopplingar utan kommentar. Detta motiveras som förenkling av modellen.
