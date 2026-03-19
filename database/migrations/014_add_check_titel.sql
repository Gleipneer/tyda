-- Migration 014: Lägg till CHECK-constraint för Poster.Titel
-- Säkerställer att titel inte är tom (MySQL 8.0.16+).

USE reflektionsarkiv;

-- Enkel constraint: titel måste ha minst ett tecken
-- CHAR_LENGTH(Titel) > 0 fångar tom sträng
SET @check_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Poster'
      AND CONSTRAINT_NAME = 'chk_poster_titel_nonempty'
);

SET @sql = IF(
    @check_exists = 0,
    'ALTER TABLE Poster ADD CONSTRAINT chk_poster_titel_nonempty CHECK (CHAR_LENGTH(Titel) > 0)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
