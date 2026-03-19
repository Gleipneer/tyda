-- Migration 012: Ta bort redundanta idx_postbegrepp_post
-- UNIQUE(PostID, BegreppID) täcker redan sökningar på PostID.

USE reflektionsarkiv;

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PostBegrepp'
      AND INDEX_NAME = 'idx_postbegrepp_post'
);

SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE PostBegrepp DROP INDEX idx_postbegrepp_post',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
