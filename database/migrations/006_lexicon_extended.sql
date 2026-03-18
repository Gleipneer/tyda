-- Migration 006: Ytterligare utökning av begreppsbiblioteket
-- Källa: Samma tolkningsramar som 003 (klassisk/Jungianskt/symbolik)
-- KÖR MED: python backend/scripts/run_migration_utf8.py

USE reflektionsarkiv;

-- ========== KÄNSLOTILLSTÅND ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('rädsla', 'Klassisk: Varning, undvikande. Jungianskt: Skugga; det vi undviker. Symbolik: Gräns, skydd, sökande.'),
('hopp', 'Klassisk: Förväntan, väntan. Symbolik: Framtid, potential, ljus.'),
('längtan', 'Klassisk: Sökande, brist. Jungianskt: Anima; det man söker. Symbolik: Väg, öppning.'),
('sorg', 'Klassisk: Förlust, avslut. Jungianskt: Nedstigning; genomgång. Symbolik: Rening, vila.'),
('glädje', 'Klassisk: Lättnad, fira. Symbolik: Öppning, ljus, gemenskap.'),
('vrede', 'Klassisk: Kraft, gräns. Jungianskt: Libido; undertryckt kraft. Symbolik: Eld, genomträngning.'),
('trygghet', 'Klassisk: Skydd, hem. Symbolik: Grund, vila.'),
('ångest', 'Klassisk: Osäkerhet, väntan. Symbolik: Gräns, övergång.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== KROPP (utökning) ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('ansikte', 'Klassisk: Identitet, uttryck. Jungianskt: Persona; det vi visar. Symbolik: Möte, spegel.'),
('rygg', 'Klassisk: Stöd, bära. Symbolik: Grund, skydd.'),
('mun', 'Klassisk: Uttryck, föda. Symbolik: Ord, mottagande.'),
('arm', 'Klassisk: Handling, omfamning. Symbolik: Kontakt, skydd.'),
('ben', 'Klassisk: Grund, rörelse. Symbolik: Stabilitet, framåt.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== RÖRELSE / RIKTNING ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('springa', 'Klassisk: Flykt eller sökande. Symbolik: Rörelse, undan.'),
('gå', 'Klassisk: Livets väg. Symbolik: Framsteg, resa.'),
('nedstigning', 'Klassisk: Undergång, ned i. Jungianskt: Nedstigning till omedvetet. Symbolik: Initiation, grund.'),
('uppåt', 'Klassisk: Stigning, transcendens. Symbolik: Högre, ljus.'),
('inåt', 'Klassisk: Inre, själv. Symbolik: Reflektion, centrum.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== GRÄNSER / SKYDD / VARNING ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('gräns', 'Klassisk: Avgränsning, tröskel. Symbolik: Övergång, val.'),
('vakt', 'Klassisk: Skydd, port. Symbolik: Gräns, tillträde.'),
('skydd', 'Klassisk: Trygghet, omsluta. Symbolik: Hem, vila.'),
('varning', 'Klassisk: Budskap, varsel. Symbolik: Opmärksamhet, förberedelse.'),
('stillhet', 'Klassisk: Tystnad, vila. Symbolik: Inre, väntan.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== NATUR (utökning) ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('mist', 'Klassisk: Oklarhet, övergång. Symbolik: Dimma, sökande.'),
('fors', 'Klassisk: Kraft, flöde. Symbolik: Rörelse, rening.'),
('blåst', 'Klassisk: Vind, rörelse. Symbolik: Förändring, ande.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== DJUR (utökning) ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('räv', 'Klassisk: List, överlevnad. Symbolik: Klokhet, anpassning.'),
('råtta', 'Klassisk: Små krafter, undan. Symbolik: Detalj, överlevnad.'),
('ekorre', 'Klassisk: Sparande, förberedelse. Symbolik: Framtidsplanering.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== FÖRÄNDRING / ÖVERGÅNGAR ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('förändring', 'Klassisk: Övergång, metamorfos. Jungianskt: Individuationsprocess. Symbolik: Ny fas, transformation.'),
('avslut', 'Klassisk: Slut, övergång. Symbolik: Fullbordan, nytt.'),
('början', 'Klassisk: Start, nytt. Symbolik: Potential, öppning.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
