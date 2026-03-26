# VG-kriterier – Status och validering

**Källa:** VG/YH_26_planering_databaser (1).pdf  
**Senast uppdaterad:** 2026-03-25

**Canonical tillsammans med:** `VG/VG_ATERSTAENDE.md` (punktlistor om återstående/delvis krav ska stämma överens med denna tabell).

---

## G-nivå

| Kriterium | Status | Validering |
|-----------|--------|------------|
| Minst 3 sammanlänkade tabeller | ✅ UPPFYLLT | 6 tabeller: Anvandare, Kategorier, Poster, Begrepp, PostBegrepp, AktivitetLogg |
| Implementera i RDBMS (MySQL/PostgreSQL) | ✅ UPPFYLLT | MySQL, mysql-connector-python |
| Primär- och främmande nycklar | ✅ UPPFYLLT | Alla tabeller har PK, Poster/PostBegrepp/AktivitetLogg har FK |
| Dataintegritet (NOT NULL, CHECK, DEFAULT, FK) | ✅ UPPFYLLT | NOT NULL, DEFAULT, FK, ENUM, UNIQUE, CHECK (titel) |
| Minst en trigger | ✅ UPPFYLLT | `trigga_ny_post_logg`, `trigga_post_uppdaterad_logg` (två triggers) |
| JOIN och GROUP BY i minst 2 frågor | ✅ UPPFYLLT | reflektionsarkiv.sql + backend repositories |
| Motivera i README | ✅ UPPFYLLT | README har sektionen "Reflektion – databasval och design" med motiveringar |

---

## VG-nivå

| Kriterium | Status | Validering |
|-----------|--------|------------|
| Välj SQL/NoSQL och motivera | ✅ UPPFYLLT | README motiverar varför relationsdatabas valdes |
| Lagrad procedur | ✅ UPPFYLLT | hamta_poster_per_kategori |
| Säkerhetsstrategi (GRANT/REVOKE) | ✅ UPPFYLLT | database/scripts/grants.sql, README Säkerhetsstrategi |
| Prestandaanalys och indexering | ✅ UPPFYLLT | docs/PRESTANDANALYS.md med EXPLAIN och indexmotivering |

---

## Övriga krav från Namnlöst dokument

| Krav | Status | Kommentar |
|------|--------|-----------|
| Synlighet: Privat och Publik (ta bort Delad, byt Offentlig→Publik) | ✅ KLAR | Migration 013, frontend, backend uppdaterade |
| Admin: Kommentar TEXT | ❌ KAN EJ | Kommentar togs bort (migration 011). Motivering: designval för förenklad modell |
