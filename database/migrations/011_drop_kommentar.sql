-- Migration 011: Ta bort Kommentar från PostBegrepp
-- Kolumnen har inga kopplingar till andra tabeller.

USE reflektionsarkiv;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PostBegrepp'
      AND COLUMN_NAME = 'Kommentar'
);

SET @sql = IF(
    @col_exists > 0,
    'ALTER TABLE PostBegrepp DROP COLUMN Kommentar',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
