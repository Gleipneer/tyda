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

## 2. CHECK-constraint

**Krav:** "Säkerställ dataintegritet genom constraints (NOT NULL, CHECK, DEFAULT, FOREIGN KEY)."

**Åtgärd:**
- Lägg till t.ex. `CHECK (CHAR_LENGTH(TRIM(Titel)) > 0)` på Poster.Titel (MySQL 8.0.16+)
- Eller `CHECK (Anvandarnamn != '')` på Anvandare

**Motivering om det INTE görs:** ENUM och NOT NULL ger redan stark integritet. CHECK stärker försvaret men är inte strikt nödvändigt för G.

---

## 3. README-reflektion

**Krav:** "Motivera dina val av databasstruktur och säkerhetsåtgärder i en skriftlig reflektion i README.md."

**Åtgärd:**
- Lägg till README-sektion: "Databasens designval" med kort motivering för:
  - Varför SQL/MySQL
  - Varför denna tabellstruktur
  - Säkerhetsåtgärder (parameteriserade frågor, .env, eventuellt GRANT)
- Länka till `docs/VG_ANALYS_OCH_ATERSTAENDE.md`

---

## 4. Prestanda – EXPLAIN-dokumentation

**Krav:** "Analysera databasens prestanda och redogör för optimeringsmöjligheter (t.ex. indexering)."

**Åtgärd:**
- Kör `EXPLAIN` på 2–3 centrala frågor (t.ex. poster per användare, begrepp per post)
- Spara resultat + kort tolkning i `docs/PRESTANDANALYS.md`
- Förklara varför idx_postbegrepp_post togs bort (migration 012)

---

## 5. Kommentar TEXT – varför det INTE uppfylls

**Krav från Namnlöst dokument:** "Admin portal: kunna se hela kommentarerna som finns om varje ord från Kommentar TEXT."

**Beslut:** Kolumnen Kommentar togs bort från PostBegrepp (migration 011) som designval – ingen UI använde den, ingen koppling till andra tabeller. Admin kan i stället se och hantera begreppskopplingar utan kommentar. Detta motiveras som förenkling av modellen.
