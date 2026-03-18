-- Migration: Utöka Begrepp med rikare symbolbibliotek
-- Källhierarki: klassisk (Artemidoros m.fl.), jungianskt, allmän symbolik
-- Epistemisk försiktighet: tolkningsramar, inte objektiv sanning
-- Ref: docs/SYMBOL_MATCHING_PLAN.md

USE reflektionsarkiv;

-- Uppdatera befintliga begrepp med rikare beskrivningar
UPDATE Begrepp SET Beskrivning = 'Klassisk: Ofta kopplad till varning eller förvandling. Jungianskt: Symbol för instinkt, rädsla, sexualitet, förändring eller det dolda; förnyelse via ömsning. Symbolik: Liv-död-dualitet, visdom, läkning.' WHERE Ord = 'orm';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Känsloliv, flytande tillstånd. Jungianskt: Det omedvetna, känslor, djup, rening. Symbolik: Ursprung, liv, övergång.' WHERE Ord = 'vatten';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Helig plats, sökande. Jungianskt: Inre rum, själv, det heliga. Symbolik: Skydd, andlighet, centrum.' WHERE Ord = 'tempel';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Mörker, okänt. Jungianskt: Skugga, det omedvetna, natt. Symbolik: Djup, mysterium, dold potential.' WHERE Ord = 'svart';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Förstörelse eller rening. Jungianskt: Energi, vilja, passion, transformation. Symbolik: Rening, livskraft, förbränning.' WHERE Ord = 'eld';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Livets väg, övergång. Jungianskt: Individuationsprocess, utveckling. Symbolik: Förändring, sökande, livsresa.' WHERE Ord = 'resa';

-- Nya begrepp – prioriterade enligt uppdrag
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('hav', 'Klassisk: Oändlighet, ursprung. Jungianskt: Kollektivt omedvetet, ursprungliga krafter. Symbolik: Djup, okänt, livets källa.'),
('flod', 'Klassisk: Tid, flöde. Jungianskt: Livsflöde, känsloström. Symbolik: Övergång, förändring, riktning.'),
('kyrka', 'Klassisk: Andlighet, gemenskap. Jungianskt: Inre helighet, själv. Symbolik: Skydd, tradition, högre mening.'),
('hus', 'Klassisk: Själ, identitet. Jungianskt: Psyket, jag. Symbolik: Inre rum, trygghet, familj.'),
('dörr', 'Klassisk: Övergång, möjlighet. Jungianskt: Tröskel till nytt. Symbolik: Val, förändring, tillgång.'),
('nyckel', 'Klassisk: Öppning, lösning. Jungianskt: Tillgång till dolt. Symbolik: Kunskap, makt, frigörelse.'),
('väg', 'Klassisk: Livsriktning. Jungianskt: Individuationsväg. Symbolik: Val, resa, framtid.'),
('skog', 'Klassisk: Vildmark, okänt. Jungianskt: Omedvetet, vilse. Symbolik: Mysterium, natur, sökande.'),
('aska', 'Klassisk: Slut, förintelse. Jungianskt: Efter transformation. Symbolik: Förbränning, renande, ny början.'),
('sot', 'Klassisk: Förorening, mörker. Symbolik: Relaterat till eld, förbränning, mörker.'),
('vit', 'Klassisk: Renhet, ljus. Jungianskt: Medvetande, renhet. Symbolik: Oskuld, ny början, ljus.'),
('mörker', 'Klassisk: Okänt, rädsla. Jungianskt: Skugga, omedvetet. Symbolik: Det dolda, natt, mysterium.'),
('ljus', 'Klassisk: Insikt, sanning. Jungianskt: Medvetande, förståelse. Symbolik: Vägledning, hopp, klarhet.'),
('natt', 'Klassisk: Vila, död. Jungianskt: Omedvetet, dröm. Symbolik: Övergång, det dolda, vila.'),
('himmel', 'Klassisk: Högre makt, andlighet. Jungianskt: Transcendens. Symbolik: Oändlighet, hopp, fader.'),
('jord', 'Klassisk: Materia, kropp. Jungianskt: Anima, det receptiva. Symbolik: Grund, moder, verklighet.'),
('moder', 'Klassisk: Ursprung, omsorg. Jungianskt: Anima, det receptiva. Symbolik: Källa, trygghet, jord.'),
('barn', 'Klassisk: Nytt, oskuldsfullt. Jungianskt: Själv i utveckling. Symbolik: Potential, ny början, sårbarhet.'),
('spegel', 'Klassisk: Självinsikt. Jungianskt: Självreflektion, skugga. Symbolik: Identitet, sanning, dubbelhet.'),
('trappa', 'Klassisk: Stigning, nedstigning. Jungianskt: Utvecklingsnivåer. Symbolik: Övergång, arbete, framsteg.'),
('berg', 'Klassisk: Stabilitet, höjd. Jungianskt: Själv, mål. Symbolik: Utmaning, centrum, fasthet.'),
('fågel', 'Klassisk: Frihet, ande. Jungianskt: Transcendens, meddelare. Symbolik: Själ, frihet, högre perspektiv.'),
('hund', 'Klassisk: Trohet, vakt. Jungianskt: Instinkt, lojalitet. Symbolik: Skydd, vänskap, instinkt.'),
('katt', 'Klassisk: Oberoende, natt. Jungianskt: Det feminina, mysterium. Symbolik: Självständighet, natt, magi.'),
('blod', 'Klassisk: Liv, släkt. Jungianskt: Livskraft, passion. Symbolik: Essens, offer, förbindelse.'),
('krona', 'Klassisk: Makt, värdighet. Jungianskt: Själv, självrealisering. Symbolik: Auktoritet, fullbordan.'),
('ring', 'Klassisk: Enhet, förbindelse. Jungianskt: Helhet, mandala. Symbolik: Löfte, cykel, slutenhet.'),
('havsvåg', 'Klassisk: Rörlighet, kraft. Symbolik: Relaterat till hav, rörelse, känslor.'),
('storm', 'Klassisk: Kaos, rening. Jungianskt: Emotionell upprivning. Symbolik: Förändring, kraft, kaos.'),
('bro', 'Klassisk: Övergång, förbindelse. Jungianskt: Länk mellan medvetet och omedvetet. Symbolik: Övergång, möte.'),
('fönster', 'Klassisk: Insikt, utsikt. Symbolik: Perspektiv, möjlighet, gräns.'),
('grav', 'Klassisk: Slut, vila. Jungianskt: Undergång, transformation. Symbolik: Avslut, begravning, nytt.'),
('död', 'Klassisk: Slut, övergång. Jungianskt: Ego-död, förvandling. Symbolik: Avslut, förnyelse, okänt.'),
('födelse', 'Klassisk: Början, nytt. Jungianskt: Ny fas. Symbolik: Ursprung, potential, start.'),
('havsdjur', 'Klassisk: Djupet, okänt. Symbolik: Relaterat till hav, det omedvetna, dolda krafter.'),
('ömsning', 'Klassisk: Förvandling. Jungianskt: Förnyelse, orm-symbolik. Symbolik: Överge gammalt, nytt skinn.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
