-- Migration 010: Ta bort RelationTyp fran PostBegrepp
-- Mal: Forenkla kopplingstabellen till (PostID, BegreppID)
-- UNIQUE andras fran (PostID, BegreppID, RelationTyp) till (PostID, BegreppID)

USE reflektionsarkiv;

-- 1. Ta bort unikt index som inkluderar RelationTyp ENDAST om RelationTyp-kolumnen finns
-- (Bas-schemat har redan UNIQUE(PostID, BegreppID) - droppa inte det)
SET @col_relationtyp = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PostBegrepp' AND COLUMN_NAME = 'RelationTyp'
);
SET @idx_name = (
    SELECT INDEX_NAME FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PostBegrepp'
      AND NON_UNIQUE = 0 AND INDEX_NAME != 'PRIMARY'
    LIMIT 1
);
SET @sql = IF(@idx_name IS NOT NULL AND @col_relationtyp > 0,
    CONCAT('ALTER TABLE PostBegrepp DROP INDEX ', @idx_name), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Ta bort RelationTyp-kolumnen
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PostBegrepp'
      AND COLUMN_NAME = 'RelationTyp'
);

SET @sql = IF(
    @col_exists > 0,
    'ALTER TABLE PostBegrepp DROP COLUMN RelationTyp',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Lagg till UNIQUE (PostID, BegreppID) om den inte redan finns
SET @uq_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PostBegrepp'
      AND INDEX_NAME = 'postbegrepp_postid_begreppid_unique'
    LIMIT 1
);

SET @sql = IF(
    @uq_exists = 0,
    'ALTER TABLE PostBegrepp ADD UNIQUE KEY postbegrepp_postid_begreppid_unique (PostID, BegreppID)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
