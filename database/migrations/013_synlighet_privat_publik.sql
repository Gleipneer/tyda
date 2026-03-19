-- Synlighet: ta bort 'delad', behåll bara privat och publik.
-- Befintliga 'delad'-poster blir 'publik'.

USE reflektionsarkiv;

UPDATE Poster SET Synlighet = 'publik' WHERE Synlighet = 'delad';

ALTER TABLE Poster MODIFY Synlighet ENUM('privat', 'publik') NOT NULL DEFAULT 'privat';
