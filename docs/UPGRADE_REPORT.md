# Uppgraderingsrapport – Reflektionsarkiv

**Datum:** 2025-03-15

---

## 1. Arkitekturbeslut

**Val: Enkel databas + smart mellanlager (Alternativ A)**

- Begrepp-tabellen oförändrad (Ord, Beskrivning)
- All normalisering, variantmatchning och symbolmatchning i Python
- Inga nya tabeller

---

## 2. Research och källor

**Källtyper:**
- Jungiansk symbolpsykologi (Jungs Red Book, arketyper)
- Klassisk drömtradition (Artemidoros Oneirocritica)
- Allmän symbolisk/mytologisk riktning

**Trovärdighet:** Prioritet till etablerade källor. Formuleringar som tolkningsramar, inte objektiv sanning.

---

## 3. Databas – utökade begrepp

**Migration:** `database/migrations/001_expand_begrepp.sql`

- 6 befintliga begrepp uppdaterade med rikare beskrivningar
- 33 nya begrepp tillagda
- Format: "Klassisk: X. Jungianskt: Y. Symbolik: Z."

**Prioriterade begrepp:** orm, vatten, hav, flod, tempel, kyrka, hus, dörr, nyckel, väg, resa, skog, eld, aska, sot, svart, vit, mörker, ljus, natt, himmel, jord, moder, barn, spegel, trappa, berg, fågel, hund, katt, blod, krona, ring, havsvåg, storm, bro, fönster, grav, död, födelse, havsdjur, ömsning

---

## 4. Mellanlager – symbol_matcher.py

**Funktioner:**
- Normalisering: lowercase, NFD, ta bort diakritika
- Tokenisering: regex på ordgränser
- Svenska suffix: -en, -et, -ar, -or, -er, -na, -n, -t
- Manuella variantmappningar: ormen→orm, vattnet→vatten, svärta→svart, ömsa→ömsning
- Deterministisk: regelbaserad, ingen AI

---

## 5. API

| Endpoint | Beskrivning |
|----------|-------------|
| POST /api/analyze/text-concepts | Matcha fri text mot Begrepp |
| GET /api/posts/{id}/matched-concepts | Automatchade begrepp för en post |

---

## 6. Frontend

- **Begrepp i fokus:** Ny sektion på post-detalj som visar automatchade begrepp
- **Matcha begrepp i text:** Knapp i formulär för ny post
- **Manuellt kopplade begrepp:** Sekundär sektion (behållen)
- **UI:** Mörkare sidebar, aktiv-indikator, premiumkänsla

---

## 7. Verifierat

- POST /api/analyze/text-concepts returnerar matches
- GET /api/posts/1/matched-concepts returnerar automatchade begrepp
- Migration kördes, begrepp utökade

---

## 8. Slutdom

**MOSTLY READY, MINOR FIXES NEEDED**

Systemet är uppgraderat. Full E2E-validering kräver att backend och frontend körs. Encoding av svenska tecken i PowerShell kan visa fel – JSON i browser/frontend ska vara korrekt.
