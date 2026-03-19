# VG-kriterier – Status och validering

**Källa:** VG/YH_26_planering_databaser (1).pdf  
**Senast uppdaterad:** Efter genomförd ändringsplan

---

## G-nivå

| Kriterium | Status | Validering |
|-----------|--------|------------|
| Minst 3 sammanlänkade tabeller | ✅ UPPFYLLT | 6 tabeller: Anvandare, Kategorier, Poster, Begrepp, PostBegrepp, AktivitetLogg |
| Implementera i RDBMS (MySQL/PostgreSQL) | ✅ UPPFYLLT | MySQL, mysql-connector-python |
| Primär- och främmande nycklar | ✅ UPPFYLLT | Alla tabeller har PK, Poster/PostBegrepp/AktivitetLogg har FK |
| Dataintegritet (NOT NULL, CHECK, DEFAULT, FK) | ⚠️ DELVIS | NOT NULL, DEFAULT, FK, ENUM, UNIQUE finns. CHECK saknas (se VG_ATERSTAENDE) |
| Minst en trigger | ✅ UPPFYLLT | trigga_ny_post_logg |
| JOIN och GROUP BY i minst 2 frågor | ✅ UPPFYLLT | reflektionsarkiv.sql + backend repositories |
| Motivera i README | ⚠️ DELVIS | README har översikt, saknar stark reflektion om designval |

---

## VG-nivå

| Kriterium | Status | Validering |
|-----------|--------|------------|
| Välj SQL/NoSQL och motivera | ⚠️ DELVIS | MySQL används, explicit motivering saknas i README |
| Lagrad procedur | ✅ UPPFYLLT | hamta_poster_per_kategori |
| Säkerhetsstrategi (GRANT/REVOKE) | ✅ UPPFYLLT | database/scripts/grants.sql, README Säkerhetsstrategi |
| Prestandaanalys och indexering | ✅ UPPFYLLT | Index motiverade, migration 012 städade redundans. EXPLAIN-dokumentation kan stärkas |

---

## Övriga krav från Namnlöst dokument

| Krav | Status | Kommentar |
|------|--------|-----------|
| Synlighet: Privat och Publik (ta bort Delad, byt Offentlig→Publik) | ✅ KLAR | Migration 013, frontend, backend uppdaterade |
| Admin: Kommentar TEXT | ❌ KAN EJ | Kommentar togs bort (migration 011). Motivering: designval för förenklad modell |
