-- =============================================================================
-- Tyda / Reflektionsarkiv – databasrättigheter (least privilege + tydlig REVOKE)
-- =============================================================================
-- Krav (VG): säkerhetsstrategi med GRANT och REVOKE för separata databasanvändare.
--
-- Kräver att databasen reflektionsarkiv redan finns (kör reflektionsarkiv.sql eller reset först).
--
-- Kör som privilegierad MySQL-användare (t.ex. root), från projektroten:
--   mysql -u root -p < database/scripts/grants.sql
--
-- Byt ALLTID lösenorden i produktion (ersätt *_placeholder nedan).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Applikationsanvändare – endast det Tyda-backend behöver vid drift
-- -----------------------------------------------------------------------------
-- Ny användare får i MySQL 8 i princip inga rättigheter automatiskt, men vi kör
-- REVOKE ALL ändå så skriptet blir idempotent: om användaren redan fanns med
-- fel/överblivna rättigheter nollställs de innan vi sätter minsta möjliga GRANT.

CREATE USER IF NOT EXISTS 'reflektionsarkiv_app'@'localhost' IDENTIFIED BY 'app_password_placeholder';

REVOKE ALL PRIVILEGES ON reflektionsarkiv.* FROM 'reflektionsarkiv_app'@'localhost';

-- DML på allt innehåll i databasen
GRANT SELECT, INSERT, UPDATE, DELETE ON reflektionsarkiv.* TO 'reflektionsarkiv_app'@'localhost';

-- Lagrad procedur (t.ex. CALL hamta_poster_per_kategori i SQL-exempel / verktyg)
GRANT EXECUTE ON reflektionsarkiv.* TO 'reflektionsarkiv_app'@'localhost';

-- DDL (CREATE/DROP/ALTER-tabeller, m.m.) ges alltså INTE – bara det som listas ovan.
-- Se docs/DATABASE_SAKERHET.md för hur REVOKE ALL + GRANT hänger ihop.

-- -----------------------------------------------------------------------------
-- 2) Valfri drift-/migrationsanvändare – full kontroll över databasen reflektionsarkiv
-- -----------------------------------------------------------------------------
-- Använd denna (eller root) när du kör reflektionsarkiv.sql, reset_database.py
-- eller migrationer – INTE i backend .env för vanlig applikationsdrift.

CREATE USER IF NOT EXISTS 'reflektionsarkiv_admin'@'localhost' IDENTIFIED BY 'admin_password_placeholder';

REVOKE ALL PRIVILEGES ON reflektionsarkiv.* FROM 'reflektionsarkiv_admin'@'localhost';

GRANT ALL PRIVILEGES ON reflektionsarkiv.* TO 'reflektionsarkiv_admin'@'localhost';

FLUSH PRIVILEGES;
