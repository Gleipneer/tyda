-- Logga i AktivitetLogg när en post uppdateras (titel, innehåll, synlighet eller kategori).
-- En rad per UPDATE som faktiskt ändrar något av dessa fält.
DROP TRIGGER IF EXISTS trigga_post_uppdaterad_logg;

CREATE TRIGGER trigga_post_uppdaterad_logg
AFTER UPDATE ON Poster
FOR EACH ROW
INSERT INTO AktivitetLogg (PostID, AnvandarID, Handelse)
SELECT NEW.PostID, NEW.AnvandarID, 'Post uppdaterad'
FROM DUAL
WHERE NOT (
    OLD.Titel <=> NEW.Titel
    AND OLD.Innehall <=> NEW.Innehall
    AND OLD.Synlighet <=> NEW.Synlighet
    AND OLD.KategoriID <=> NEW.KategoriID
);
