-- Säkerhetsstrategi: least-privilege för app-användaren
-- Kör som root/admin: mysql -u root -p < database/scripts/grants.sql

-- Skapa dedikerad app-användare (ersätt lösenord i produktion)
CREATE USER IF NOT EXISTS 'reflektionsarkiv_app'@'localhost' IDENTIFIED BY 'app_password_placeholder';

-- Endast DML: SELECT, INSERT, UPDATE, DELETE
-- DROP, CREATE, ALTER och andra DDL-rättigheter ges INTE till app-användaren.
-- Migrationer och schemaändringar körs separat med root/admin.
GRANT SELECT, INSERT, UPDATE, DELETE ON reflektionsarkiv.* TO 'reflektionsarkiv_app'@'localhost';

FLUSH PRIVILEGES;
