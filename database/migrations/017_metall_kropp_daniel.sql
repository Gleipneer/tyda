-- Migration 017: Material, kropp och staty – saknade basord för profetisk/symbolisk text
-- (t.ex. Daniel 2) och liknande drömmar. ON DUPLICATE behåller befintliga ID:n.
-- Ord lagras med svenska tecken; matchning normaliserar till ASCII-lik nyckel i backend.

INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('brons', 'Klassisk: Tredje metall i sekvenser; historiskt bronsålder. Symbolik: Makt, auktoritet, mellan skikt.'),
('järn', 'Klassisk: Hårdhet, erövring, järnålder. Symbolik: Styrka, krossande makt, beständighet.'),
('lera', 'Klassisk: Formbar jord, svag fundament. Symbolik: Mänsklighet, sårbarhet, blandning.'),
('huvud', 'Klassisk: Höjd, ledning, tänkande. Symbolik: Auktoritet, medvetande, översta nivå.'),
('staty', 'Klassisk: Bild, avgud, upprättstående gestalt. Symbolik: Makt, sken, material uppdelat i skikt.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
