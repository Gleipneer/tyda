-- Migration: Lägg till känsla för svenska böjningsformer
-- KÖR MED: python backend/scripts/run_migration_utf8.py

USE reflektionsarkiv;

INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('känsla', 'Klassisk: Inre tillstånd, emotionell reaktion. Jungianskt: Anima, affekt; känsloliv som väg till omedvetet. Symbolik: Inre liv, receptivitet, sårbarhet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
