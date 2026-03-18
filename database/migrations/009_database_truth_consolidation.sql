-- Migration 009: Database truth + system consolidation
-- Mål:
-- 1. ta bort verkligt redundanta index
-- 2. lägga till index för faktisk aktivitetsanvändning
-- 3. göra delete-strategin explicit där appen redan beter sig så

USE reflektionsarkiv;

-- Redundanta index: UNIQUE skapar redan egna index i MySQL
SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Anvandare'
      AND INDEX_NAME = 'idx_anvandare_epost'
  ) > 0,
  'DROP INDEX idx_anvandare_epost ON Anvandare',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Begrepp'
      AND INDEX_NAME = 'idx_begrepp_ord'
  ) > 0,
  'DROP INDEX idx_begrepp_ord ON Begrepp',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Håll AktivitetLogg liten: behåll bara index som hjälper faktiska lookup-frågor nu
SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'AktivitetLogg'
      AND INDEX_NAME = 'idx_aktivitetlogg_tidpunkt_loggid'
  ) > 0,
  'DROP INDEX idx_aktivitetlogg_tidpunkt_loggid ON AktivitetLogg',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'AktivitetLogg'
      AND INDEX_NAME = 'idx_aktivitetlogg_post_tidpunkt'
  ) = 0,
  'CREATE INDEX idx_aktivitetlogg_post_tidpunkt ON AktivitetLogg (PostID, Tidpunkt)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Gör delete-strategin explicit där applikationen redan rensar barnrader manuellt
SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'postbegrepp_ibfk_1'
      AND DELETE_RULE = 'CASCADE'
  ) = 0,
  'ALTER TABLE PostBegrepp DROP FOREIGN KEY postbegrepp_ibfk_1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'postbegrepp_ibfk_1'
      AND DELETE_RULE = 'CASCADE'
  ) = 0,
  'ALTER TABLE PostBegrepp ADD CONSTRAINT postbegrepp_ibfk_1 FOREIGN KEY (PostID) REFERENCES Poster(PostID) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'postbegrepp_ibfk_2'
      AND DELETE_RULE = 'CASCADE'
  ) = 0,
  'ALTER TABLE PostBegrepp DROP FOREIGN KEY postbegrepp_ibfk_2',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'postbegrepp_ibfk_2'
      AND DELETE_RULE = 'CASCADE'
  ) = 0,
  'ALTER TABLE PostBegrepp ADD CONSTRAINT postbegrepp_ibfk_2 FOREIGN KEY (BegreppID) REFERENCES Begrepp(BegreppID) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'aktivitetlogg_ibfk_1'
      AND DELETE_RULE = 'CASCADE'
  ) = 0,
  'ALTER TABLE AktivitetLogg DROP FOREIGN KEY aktivitetlogg_ibfk_1',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'aktivitetlogg_ibfk_1'
      AND DELETE_RULE = 'CASCADE'
  ) = 0,
  'ALTER TABLE AktivitetLogg ADD CONSTRAINT aktivitetlogg_ibfk_1 FOREIGN KEY (PostID) REFERENCES Poster(PostID) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
