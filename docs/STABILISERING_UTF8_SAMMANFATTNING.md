# Stabiliseringspass – UTF-8 och kvalitet

**Datum:** 2025-03-15

---

## 1. Root cause (encoding)

**Problem:** Å, ä, ö visades som `??` i UI och API.

**Orsak:** Migrationerna kördes via mysql CLI (eller pipning i PowerShell). MySQL-klienten använder cp850 på Windows, så UTF-8-bytes i SQL-filerna tolkades fel och sparades som `?`.

**Verifierat:** `SELECT HEX(SUBSTRING(Beskrivning, 1, 30))` visade `3F3F` där det ska vara `C3A4` (ä).

---

## 2. Genomförd fix

### 2.1 Migrationer med UTF-8

- **Skript:** `backend/scripts/run_migration_utf8.py` – läser SQL-filer som UTF-8 och kör via `mysql-connector-python` med `charset="utf8mb4"`.
- **Ändring:** `cursor.execute(sql, multi=True)` används för att köra flera satser (inkl. semicolon i strängar).

### 2.2 Reparation av databas

- **Skript:** `backend/scripts/repair_begrepp_encoding.py` – tar bort PostBegrepp och Begrepp, kör migrationer med UTF-8.
- **OBS:** Manuella begrepp-kopplingar (PostBegrepp) tas bort vid reparation.

### 2.3 Symbolmatcher – normaliserad lookup

- **Problem:** `VARIANT_TO_BASE` och `SYNONYM_TO_BASE` använde nycklar med åäö, men `normalize_for_match()` tar bort diakritika. Lookup misslyckades för `drömde`, `känslor` m.fl.
- **Fix:** Lookup görs nu med normaliserad nyckel (fallback till matchning via `normalize_for_match(k) == w`).

### 2.4 Svenska böjningsformer

- `drömde` → `dröm` (VARIANT_TO_BASE, SYNONYM_TO_BASE)
- `mörkt` → `mörker` (SYNONYM_TO_BASE)
- `känslor` → `känsla` (VARIANT_TO_BASE)
- Nytt begrepp: `känsla` (migration 004_add_kansla.sql)

### 2.5 Begreppskort

- Beskrivning parsas i Klassisk/Jungianskt/Symbolik och visas som strukturerade block.
- Tillägg i CSS: `.concept-desc-block`, `.concept-desc-label`.

---

## 3. Verifiering

### UTF-8

- **Databas:** `SELECT HEX(SUBSTRING(Beskrivning, 1, 80))` för vatten visar `C3A4` (ä), `C3A5` (å), `C3B6` (ö).
- **API:** `POST /api/analyze/text-concepts` med `{"text":"Jag drömde om mörkt vatten och känslor i ett tempel. Förvandling."}` returnerar JSON med korrekt UTF-8.
- **Frontend:** `<meta charset="UTF-8" />` i `index.html`.

### Matchning

- `drömde` → dröm
- `mörkt` → mörker
- `känslor` → känsla
- `förvandling` → förvandling (exakt)

---

## 4. Kommandon

```bash
# Kör migrationer (UTF-8)
cd backend && python scripts/run_migration_utf8.py

# Vid korrupt data – reparation (tar bort PostBegrepp)
cd backend && python scripts/repair_begrepp_encoding.py
```

---

## 5. Slutdom

**READY TO DEMO**

- UTF-8 fungerar genom hela kedjan:
  - Databas: utf8mb4
  - Backend: charset="utf8mb4", collation="utf8mb4_unicode_ci"
  - API: JSON med UTF-8
  - Frontend: meta charset UTF-8
- Svenska tecken visas korrekt.
- Matchning fungerar för drömde→dröm, mörkt→mörker, känslor→känsla.
- Begreppskorten är mer läsbara med strukturerad beskrivning.

**OBS:** Starta om backend efter kodändringar för att matchningen ska gälla.
