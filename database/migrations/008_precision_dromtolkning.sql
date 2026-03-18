-- Migration 008: Precision-pass för drömtolkning
-- Fokus: semantiska luckor, vanliga drömverb, negation/hinder, sensorik, rumstillstånd
-- INTE massord – endast högvärdiga begrepp som saknades efter 003–007
-- KÖR MED: python backend/scripts/run_migration_utf8.py

USE reflektionsarkiv;

-- ========== 1. VANLIGA DRÖMVERB ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('hitta', 'Klassisk: Upptäcka, nå mål. Symbolik: Sökande som lyckas, insikt.'),
('leta', 'Klassisk: Söka, sträva. Symbolik: Pilgrimsfärd, sökande.'),
('försvinna', 'Klassisk: Förlora, gå bort. Symbolik: Avslut, övergång, förlust.'),
('vakna', 'Klassisk: Övergång dröm–vaken. Symbolik: Uppvaknande, medvetande.'),
('somna', 'Klassisk: Övergång vaken–dröm. Symbolik: Nedstigning, omedvetet.'),
('skrika', 'Klassisk: Uttryck, varning. Symbolik: Rösta som inte hörs, desperation.'),
('ropa', 'Klassisk: Kalla, söka kontakt. Symbolik: Kommunikation, sökande.'),
('höra', 'Klassisk: Uppfatta ljud. Symbolik: Mottagande, budskap.'),
('viska', 'Klassisk: Dolt budskap. Symbolik: Hemlighet, inre röst.'),
('förlora', 'Klassisk: Förlust, avslut. Jungianskt: Ego-förlust. Symbolik: Avslut, lärande.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 2. HINDER / BLOCKERING / PASSAGE ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('hinder', 'Klassisk: Blockering, stopp. Symbolik: Gräns, oförmåga, prövning.'),
('låst', 'Klassisk: Stängd passage. Symbolik: Tillgång förnekad, hemlighet.'),
('låsa', 'Klassisk: Stänga, säkra. Symbolik: Skydd, avgränsning.'),
('utgång', 'Klassisk: Passage ut. Symbolik: Frigörelse, möjlighet.'),
('ingång', 'Klassisk: Passage in. Symbolik: Tillträde, initiering.'),
('återvändsgränd', 'Klassisk: Stoppad väg. Symbolik: Hinder, vändpunkt.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 3. RUMSLIGA TILLSTÅND ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('trasig', 'Klassisk: Söndrad, ofullständig. Symbolik: Förlust, behov av reparation.'),
('smal', 'Klassisk: Begränsad passage. Symbolik: Trångt, prövning.'),
('bred', 'Klassisk: Öppen, rymlig. Symbolik: Möjlighet, frihet.'),
('hal', 'Klassisk: Ostadig underlag. Symbolik: Risk, tappad kontroll.'),
('brant', 'Klassisk: Svår stigning. Symbolik: Utmaning, arbete.'),
('trång', 'Klassisk: Begränsat utrymme. Symbolik: Tryck, begränsning.'),
('oändlig', 'Klassisk: Gränslös. Symbolik: Transcendens, okänt.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 4. SENSORIK OCH PERCEPTION ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('ljud', 'Klassisk: Hörbart budskap. Symbolik: Varning, kall, meddelande.'),
('skrik', 'Klassisk: Skrik, rop. Symbolik: Desperation, varning.'),
('viskning', 'Klassisk: Dolt ljud. Symbolik: Hemlighet, inre röst.'),
('tryck', 'Klassisk: Fysisk eller psykisk press. Symbolik: Begränsning, stress.'),
('tyngd', 'Klassisk: Tung, bära. Symbolik: Ansvar, börda.'),
('beröring', 'Klassisk: Kontakt, känna. Symbolik: Nära, gräns.'),
('lukt', 'Klassisk: Doft, lukt. Symbolik: Minne, association.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 5. SOCIALA MÖNSTER ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('ignorera', 'Klassisk: Inte se, förbigå. Symbolik: Osynlighet, avvisning.'),
('kalla', 'Klassisk: Ropa, mana. Symbolik: Kall, budskap.'),
('rädda', 'Klassisk: Befria, skydda. Symbolik: Frälsning, omsorg.'),
('hot', 'Klassisk: Hot, fara. Symbolik: Rädsla, gräns.'),
('hota', 'Klassisk: Hota, varna. Symbolik: Makt, rädsla.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
