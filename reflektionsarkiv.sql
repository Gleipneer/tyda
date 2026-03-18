/*
SQL slutprojekt "Reflektionsarkiv".
Joakim Emilsson - YH24
*/

-- Tar bort databasen om den redan finns så att filen går att köra om från början
DROP DATABASE IF EXISTS reflektionsarkiv;

-- Skapa databasen
CREATE DATABASE reflektionsarkiv
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Välj att arbeta i databasen reflektionsarkiv
USE reflektionsarkiv;

-- Tabell: Anvandare
-- Här sparas information om användarna
CREATE TABLE Anvandare (
    AnvandarID INT AUTO_INCREMENT PRIMARY KEY,
    Anvandarnamn VARCHAR(100) NOT NULL,
    Epost VARCHAR(255) NOT NULL UNIQUE,
    SkapadDatum TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabell: Kategorier
-- Här sparas vilka typer av poster som finns, till exempel dröm, vision och tanke
CREATE TABLE Kategorier (
    KategoriID INT AUTO_INCREMENT PRIMARY KEY,
    Namn VARCHAR(50) NOT NULL UNIQUE,
    Beskrivning TEXT
);

-- Tabell: Poster
-- Här sparas själva användarens inlägg, alltså drömmar, visioner, tankar och reflektioner
CREATE TABLE Poster (
    PostID INT AUTO_INCREMENT PRIMARY KEY,
    AnvandarID INT NOT NULL,
    KategoriID INT NOT NULL,
    Titel VARCHAR(150) NOT NULL,
    Innehall TEXT NOT NULL,
    Synlighet ENUM('privat', 'delad', 'publik') NOT NULL DEFAULT 'privat',
    SkapadDatum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AnvandarID) REFERENCES Anvandare(AnvandarID),
    FOREIGN KEY (KategoriID) REFERENCES Kategorier(KategoriID)
);

-- Skapar index på främmande nycklar i Poster
CREATE INDEX idx_poster_anvandare ON Poster(AnvandarID);
CREATE INDEX idx_poster_kategori ON Poster(KategoriID);
CREATE INDEX idx_poster_skapaddatum ON Poster(SkapadDatum);

-- Tabell: Begrepp
-- Här sparas ord eller symboler som kan kopplas till poster, till exempel orm, vatten, tempel och svart
CREATE TABLE Begrepp (
    BegreppID INT AUTO_INCREMENT PRIMARY KEY,
    Ord VARCHAR(100) NOT NULL UNIQUE,
    Beskrivning TEXT NOT NULL,
    SkapadDatum TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabell: PostBegrepp
-- Detta är kopplingstabellen mellan Poster och Begrepp
-- En post kan ha många begrepp och ett begrepp kan finnas i många poster
CREATE TABLE PostBegrepp (
    PostBegreppID INT AUTO_INCREMENT PRIMARY KEY,
    PostID INT NOT NULL,
    BegreppID INT NOT NULL,
    RelationTyp ENUM('huvudsymbol', 'bisyftning', 'aterkommande tema', 'farg') NOT NULL DEFAULT 'huvudsymbol',
    Kommentar TEXT,
    FOREIGN KEY (PostID) REFERENCES Poster(PostID) ON DELETE CASCADE,
    FOREIGN KEY (BegreppID) REFERENCES Begrepp(BegreppID) ON DELETE CASCADE,
    UNIQUE (PostID, BegreppID, RelationTyp)
);

-- Skapar index på kopplingstabellen
CREATE INDEX idx_postbegrepp_post ON PostBegrepp(PostID);
CREATE INDEX idx_postbegrepp_begrepp ON PostBegrepp(BegreppID);

-- Tabell: AktivitetLogg
-- Denna tabell används som enkel aktivitetslogg för poster
-- I dagens implementation skrivs en rad när en ny post skapas
CREATE TABLE AktivitetLogg (
    LoggID INT AUTO_INCREMENT PRIMARY KEY,
    PostID INT NOT NULL,
    AnvandarID INT NOT NULL,
    Handelse VARCHAR(100) NOT NULL,
    Tidpunkt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PostID) REFERENCES Poster(PostID) ON DELETE CASCADE,
    FOREIGN KEY (AnvandarID) REFERENCES Anvandare(AnvandarID)
);

-- Skapar index som matchar hur aktivitetsloggen läses per post i appen
CREATE INDEX idx_aktivitetlogg_post_tidpunkt ON AktivitetLogg(PostID, Tidpunkt);

-- Trigger: trigga_ny_post_logg
-- Denna trigger loggar automatiskt när en ny post läggs in i tabellen Poster
DELIMITER //

CREATE TRIGGER trigga_ny_post_logg
AFTER INSERT ON Poster
FOR EACH ROW
BEGIN
    INSERT INTO AktivitetLogg (PostID, AnvandarID, Handelse)
    VALUES (NEW.PostID, NEW.AnvandarID, 'Ny post skapad');
END //

DELIMITER ;

-- Stored Procedure: hamta_poster_per_kategori
-- Denna procedur visar hur många poster som skapats per kategori mellan två datum
DELIMITER //

CREATE PROCEDURE hamta_poster_per_kategori (
    IN p_fran_datum DATE,
    IN p_till_datum DATE
)
BEGIN
    SELECT
        Kategorier.KategoriID,
        Kategorier.Namn,
        COUNT(Poster.PostID) AS AntalPoster
    FROM Kategorier
    LEFT JOIN Poster ON Kategorier.KategoriID = Poster.KategoriID
    AND Poster.SkapadDatum >= p_fran_datum
    AND Poster.SkapadDatum < DATE_ADD(p_till_datum, INTERVAL 1 DAY)
    GROUP BY Kategorier.KategoriID, Kategorier.Namn
    ORDER BY AntalPoster DESC;
END //

DELIMITER ;

-- Inject: Kategorier
-- Här lägger jag in olika typer av poster
INSERT INTO Kategorier (Namn, Beskrivning) VALUES
    ('drom', 'Poster om drömmar och nattliga upplevelser'),
    ('vision', 'Poster om visioner eller inre bilder'),
    ('tanke', 'Poster om tankar och funderingar'),
    ('reflektion', 'Poster med eftertanke och självgranskning'),
    ('dikt', 'Poster i poetisk form');

-- Query
-- Denna SELECT visar alla kategorier i tabellen Kategorier
SELECT * FROM Kategorier;

-- Inject: Anvandare
-- Här lägger jag in tre användare
INSERT INTO Anvandare (Anvandarnamn, Epost) VALUES
    ('Joakim Emilsson', 'joakim@example.com'),
    ('Anna Svensson', 'anna@example.com'),
    ('Elias Holm', 'elias@example.com');

-- Query
-- Denna SELECT visar alla användare i tabellen Anvandare
SELECT * FROM Anvandare;

-- Inject: Begrepp
-- Här lägger jag in olika ord och symboler som databasen känner till
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
    ('orm', 'Kan kopplas till instinkt, rädsla, förändring eller något dolt'),
    ('vatten', 'Kan kopplas till känslor, djup eller det omedvetna'),
    ('tempel', 'Kan symbolisera ett inre rum, sökande eller det heliga'),
    ('svart', 'Kan kopplas till skugga, okändhet, natt eller djup'),
    ('eld', 'Kan stå för energi, vilja, rening eller transformation'),
    ('resa', 'Kan symbolisera utveckling, förändring eller livsväg');

-- Query
-- Denna SELECT visar alla begrepp i tabellen Begrepp
SELECT * FROM Begrepp;

-- Inject: Poster
-- Här lägger jag in sex poster
-- När dessa rader läggs in kommer triggern automatiskt skapa loggrader i AktivitetLogg
INSERT INTO Poster (AnvandarID, KategoriID, Titel, Innehall, Synlighet) VALUES
    (1, 1, 'Dröm om orm i tempel', 'Jag drömde om en svart orm i ett tempel.', 'privat'),
    (1, 4, 'Reflektion om rädsla', 'Jag tror att drömmen handlade om förändring och osäkerhet.', 'delad'),
    (2, 3, 'Tanke om vatten', 'Jag tänker ofta på vatten som lugn men också djup.', 'publik'),
    (2, 1, 'Dröm om eld', 'Jag drömde att allt runt mig brann men jag var lugn.', 'delad'),
    (3, 2, 'Vision av resa', 'Jag såg en lång väg genom mörker mot ett ljus.', 'publik'),
    (3, 5, 'Kort dikt om natt', 'Natten bar mig över vatten och sten.', 'publik');

-- Query
-- Denna SELECT visar alla poster i tabellen Poster
SELECT * FROM Poster;

-- Inject: PostBegrepp
-- Här kopplas olika begrepp till olika poster
-- Detta visar många-till-många-relationen i databasen
INSERT INTO PostBegrepp (PostID, BegreppID, RelationTyp, Kommentar) VALUES
    (1, 1, 'huvudsymbol', 'Ormen var central i drömmen'),
    (1, 3, 'huvudsymbol', 'Templet var platsen i drömmen'),
    (1, 4, 'farg', 'Ormen var svart'),
    (2, 1, 'aterkommande tema', 'Reflektionen kopplar tillbaka till drömmen om ormen'),
    (3, 2, 'huvudsymbol', 'Vatten är huvudtemat i denna tanke'),
    (4, 5, 'huvudsymbol', 'Eld var den tydligaste symbolen'),
    (5, 6, 'huvudsymbol', 'Visionen handlade om en resa'),
    (6, 2, 'bisyftning', 'Vatten finns med i dikten');

-- Query
-- Denna SELECT visar alla kopplingar mellan poster och begrepp
SELECT * FROM PostBegrepp;

-- Query
-- Denna SELECT visar att triggern för AktivitetLogg fungerar
SELECT * FROM AktivitetLogg;

-- Denna SELECT hämtar alla poster
SELECT * FROM Poster;

-- Denna SELECT använder WHERE för att visa en specifik kategori
SELECT *
FROM Kategorier
WHERE Namn = 'drom';

-- Denna SELECT använder WHERE för att visa en specifik användare utifrån namn
SELECT *
FROM Anvandare
WHERE Anvandarnamn = 'Joakim Emilsson';

-- Denna SELECT använder WHERE för att visa begreppet orm
SELECT *
FROM Begrepp
WHERE Ord = 'orm';

-- Denna SELECT använder ORDER BY för att sortera poster efter senaste skapadatum
SELECT *
FROM Poster
ORDER BY SkapadDatum DESC;

-- Denna JOIN visar vilka begrepp som ingår i varje post
SELECT
    PostBegrepp.PostID,
    Poster.Titel,
    Begrepp.Ord,
    PostBegrepp.RelationTyp,
    PostBegrepp.Kommentar
FROM PostBegrepp
JOIN Poster ON PostBegrepp.PostID = Poster.PostID
JOIN Begrepp ON PostBegrepp.BegreppID = Begrepp.BegreppID;

-- Detta är en INNER JOIN som visar vilka användare som har skapat poster
-- Bara användare som faktiskt har en post kommer med i resultatet
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    Poster.PostID,
    Poster.Titel
FROM Anvandare
INNER JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID;

-- Detta är en INNER JOIN som visar poster tillsammans med kategori
SELECT
    Poster.PostID,
    Poster.Titel,
    Kategorier.Namn AS Kategori
FROM Poster
INNER JOIN Kategorier ON Poster.KategoriID = Kategorier.KategoriID;

-- Detta är en LEFT JOIN som visar alla användare, även de som inte skulle ha några poster
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    Poster.PostID,
    Poster.Titel
FROM Anvandare
LEFT JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID;

-- Denna SELECT använder GROUP BY för att räkna hur många poster varje användare har skrivit
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    COUNT(Poster.PostID) AS AntalPoster
FROM Anvandare
LEFT JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID
GROUP BY Anvandare.AnvandarID, Anvandare.Anvandarnamn;

-- Denna SELECT använder GROUP BY för att visa vilka begrepp som används mest
SELECT
    Begrepp.BegreppID,
    Begrepp.Ord,
    COUNT(PostBegrepp.PostBegreppID) AS AntalKopplingar
FROM Begrepp
LEFT JOIN PostBegrepp ON Begrepp.BegreppID = PostBegrepp.BegreppID
GROUP BY Begrepp.BegreppID, Begrepp.Ord
ORDER BY AntalKopplingar DESC;

-- Denna SELECT använder HAVING för att bara visa användare som har skrivit fler än 1 post
SELECT
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    COUNT(Poster.PostID) AS AntalPoster
FROM Anvandare
LEFT JOIN Poster ON Anvandare.AnvandarID = Poster.AnvandarID
GROUP BY Anvandare.AnvandarID, Anvandare.Anvandarnamn
HAVING COUNT(Poster.PostID) > 1;

-- Denna SELECT visar poster tillsammans med användare, kategori och begrepp
-- Den är bra för att visa flera JOINs samtidigt
SELECT
    Poster.PostID,
    Poster.Titel,
    Anvandare.Anvandarnamn,
    Kategorier.Namn AS Kategori,
    Begrepp.Ord,
    PostBegrepp.RelationTyp
FROM Poster
INNER JOIN Anvandare ON Poster.AnvandarID = Anvandare.AnvandarID
INNER JOIN Kategorier ON Poster.KategoriID = Kategorier.KategoriID
LEFT JOIN PostBegrepp ON Poster.PostID = PostBegrepp.PostID
LEFT JOIN Begrepp ON PostBegrepp.BegreppID = Begrepp.BegreppID
ORDER BY Poster.PostID;

-- Detta är en transaktion med UPDATE
-- Här uppdaterar jag en användares e-postadress och ångrar sedan ändringen
START TRANSACTION;
UPDATE Anvandare
SET Epost = 'joakim.nyepost@example.com'
WHERE AnvandarID = 1;

-- Denna SELECT visar ändringen innan jag ångrar den
SELECT * FROM Anvandare WHERE AnvandarID = 1;

-- Här ångrar jag ändringen med ROLLBACK
ROLLBACK;

-- Denna SELECT visar att ändringen inte sparades
SELECT * FROM Anvandare WHERE AnvandarID = 1;

-- Detta är en transaktion med DELETE
-- PostBegrepp och AktivitetLogg rensas nu via ON DELETE CASCADE
START TRANSACTION;
DELETE FROM Poster
WHERE PostID = 6;

-- Denna SELECT visar posterna innan jag ångrar borttagningen
SELECT * FROM Poster;

-- Här ångrar jag borttagningen med ROLLBACK
ROLLBACK;

-- Denna SELECT visar att posten inte togs bort på riktigt
SELECT * FROM Poster WHERE PostID = 6;

-- Denna SELECT anropar den lagrade proceduren
-- Här visar jag hur många poster som skapats per kategori mellan två datum
CALL hamta_poster_per_kategori('2024-01-01', '2026-12-31');

-- Skapa en tom testdatabas för restoretest
DROP DATABASE IF EXISTS reflektionsarkiv_restoretest;
CREATE DATABASE reflektionsarkiv_restoretest;

-- Växla till restoretest-databasen
USE reflektionsarkiv_restoretest;

-- Visa att den är tom innan restore
SHOW TABLES;
SHOW DATABASES;

-- Gå tillbaka till originaldatabasen
USE reflektionsarkiv;

-- Visa att tabellerna finns i originaldatabasen
SHOW TABLES;

-- Gå tillbaka till restoretest igen om man vill testa import där senare
USE reflektionsarkiv_restoretest;
SHOW TABLES;