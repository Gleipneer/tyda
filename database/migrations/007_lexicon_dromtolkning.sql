-- Migration 007: Begrepp för drömtolkning – riktning, rörelse, gränser, kontroll, ljus
-- Källa: Rekommenderad utvidgning för AI-tolkning (riktning, vertikalitet, passage, balans, sikt)
-- KÖR MED: python backend/scripts/run_migration_utf8.py (från backend/)

USE reflektionsarkiv;

-- ========== 1. KARDINALRIKTNINGAR OCH ORIENTERING ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('norr', 'Klassisk: Orientering, riktning. Symbolik: Vägval, positionering.'),
('söder', 'Klassisk: Orientering, riktning. Symbolik: Vägval, positionering.'),
('öst', 'Klassisk: Orientering, gryning. Symbolik: Början, ljus.'),
('väst', 'Klassisk: Orientering, skymning. Symbolik: Avslut, övergång.'),
('nord', 'Klassisk: Orientering. Symbolik: Riktning, vägval.'),
('syd', 'Klassisk: Orientering. Symbolik: Riktning, vägval.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 2. RELATIVA RIKTNINGAR ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('vänster', 'Klassisk: Sida, riktning. Jungianskt: Omedvetet, intuitivt. Symbolik: Rörelseriktning, relation.'),
('höger', 'Klassisk: Sida, riktning. Jungianskt: Medvetet, rationellt. Symbolik: Rörelseriktning, relation.'),
('fram', 'Klassisk: Framåt, riktning. Symbolik: Progression, framtid.'),
('framåt', 'Klassisk: Framåt, riktning. Symbolik: Progression, framtid.'),
('bak', 'Klassisk: Bakåt, riktning. Symbolik: Tillbaka, förflutet.'),
('bakåt', 'Klassisk: Bakåt, riktning. Symbolik: Tillbaka, förflutet.'),
('upp', 'Klassisk: Uppåt, höjd. Symbolik: Stigning, transcendens.'),
('ner', 'Klassisk: Nedåt, djup. Symbolik: Nedstigning, grund.'),
('ned', 'Klassisk: Nedåt, djup. Symbolik: Nedstigning, grund.'),
('nedåt', 'Klassisk: Nedåt, djup. Symbolik: Nedstigning, grund.'),
('in', 'Klassisk: Inåt, inre. Symbolik: Inträde, centrum.'),
('inåt', 'Klassisk: Inåt, inre. Symbolik: Reflektion, centrum.'),
('ut', 'Klassisk: Utåt, yttre. Symbolik: Utträde, frigörelse.'),
('utåt', 'Klassisk: Utåt, yttre. Symbolik: Utträde, frigörelse.'),
('bort', 'Klassisk: Bort, avstånd. Symbolik: Separation, flykt.'),
('tillbaka', 'Klassisk: Återvända. Symbolik: Återkomst, cykel.'),
('runt', 'Klassisk: Cirkulärt. Symbolik: Cykel, omkrets.'),
('omkring', 'Klassisk: Runt, omgivning. Symbolik: Kontext, gräns.'),
('genom', 'Klassisk: Passage. Symbolik: Övergång, genomträngning.'),
('mellan', 'Klassisk: Liminalitet. Symbolik: Gräns, övergång.'),
('ovanför', 'Klassisk: Höjd, över. Symbolik: Överordning, transcendens.'),
('under', 'Klassisk: Under, nedanför. Symbolik: Grund, det dolda.'),
('bredvid', 'Klassisk: Sida, närhet. Symbolik: Relation, jämbörd.'),
('framför', 'Klassisk: Före, framför. Symbolik: Mål, väg.'),
('bakom', 'Klassisk: Efter, bakom. Symbolik: Det dolda, förflutet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 3. VERTIKALITET OCH HÖJDFÖRÄNDRING ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('stiga', 'Klassisk: Stigning, upp. Jungianskt: Transcendens, individuation. Symbolik: Kontroll, progression.'),
('sjunka', 'Klassisk: Nedgång, under. Jungianskt: Nedstigning till omedvetet. Symbolik: Undergång, grund.'),
('ramla', 'Klassisk: Falla, tappa kontroll. Symbolik: Tappad kontroll, överraskning.'),
('sväva', 'Klassisk: Lätthet, flyga. Symbolik: Frihet, transcendens.'),
('lyfta', 'Klassisk: Höja, bära upp. Symbolik: Upplyftning, stöd.'),
('höja', 'Klassisk: Stiga, öka. Symbolik: Progression, höjd.'),
('sänka', 'Klassisk: Låta sjunka. Symbolik: Nedgång, ödmjukhet.'),
('klättra', 'Klassisk: Bestiga, uppåt. Symbolik: Arbete, mål.'),
('störta', 'Klassisk: Falla, rasera. Symbolik: Kollaps, plötslig förändring.'),
('rasa', 'Klassisk: Falla, kollapsa. Symbolik: Undergång, förlust.'),
('glida', 'Klassisk: Röra sig utan motstånd. Symbolik: Lätthet, flyt.'),
('dala', 'Klassisk: Sjunka, nedgång. Symbolik: Nedstigning.'),
('flyga', 'Klassisk: Frihet, transcendens. Jungianskt: Andlighet, höjd. Symbolik: Lätthet, överblick.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 4. RÖRELSETYP OCH TEMPO ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('rusa', 'Klassisk: Springa, hastigt. Symbolik: Press, flykt.'),
('krypa', 'Klassisk: Långsamt framåt. Symbolik: Ödmjukhet, sårbarhet.'),
('smyga', 'Klassisk: Dold rörelse. Symbolik: Försiktighet, undvikande.'),
('jaga', 'Klassisk: Förfölja, söka. Symbolik: Sökande, press.'),
('fly', 'Klassisk: Undanflykt. Symbolik: Flykt, överlevnad.'),
('vandra', 'Klassisk: Gå, resa. Symbolik: Pilgrimsfärd, sökande.'),
('snubbla', 'Klassisk: Tappa balans. Symbolik: Hindrande, oväntat.'),
('stappla', 'Klassisk: Ostadig gång. Symbolik: Instabilitet, svaghet.'),
('dras', 'Klassisk: Yttre kraft. Symbolik: Passivitet, tvång.'),
('driva', 'Klassisk: Rörlighet utan styrning. Symbolik: Maktlöshet, flöde.'),
('dyka', 'Klassisk: Ned i vatten. Symbolik: Nedstigning, dold kunskap.'),
('kasta', 'Klassisk: Slunga, kasta. Symbolik: Avstånd, separation.'),
('slungas', 'Klassisk: Kastas av kraft. Symbolik: Yttre kraft, maktlöshet.'),
('snurra', 'Klassisk: Rotera, virvla. Symbolik: Förvirring, cykel.'),
('långsamt', 'Klassisk: Låg tempo. Symbolik: Tålamod, tröghet.'),
('snabbt', 'Klassisk: Hög tempo. Symbolik: Press, hast.'),
('plötsligt', 'Klassisk: Oväntat. Symbolik: Överraskning, förändring.'),
('hastigt', 'Klassisk: Snabbt. Symbolik: Press, flykt.'),
('frusen', 'Klassisk: Stillastående. Symbolik: Paus, frysta känslor.'),
('paus', 'Klassisk: Avbrott. Symbolik: Vila, väntan.'),
('stopp', 'Klassisk: Upphörande. Symbolik: Gräns, avslut.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 5. GRÄNSER, PASSAGER OCH ÖVERGÅNGAR ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('stig', 'Klassisk: Väg, passage. Symbolik: Övergång, sökande.'),
('öppning', 'Klassisk: Öppning, passage. Symbolik: Möjlighet, tillträde.'),
('passage', 'Klassisk: Genomgång. Symbolik: Övergång, möjlighet.'),
('korsning', 'Klassisk: Korsväg. Symbolik: Val, möte.'),
('kant', 'Klassisk: Gräns, rand. Symbolik: Övergång, risk.'),
('stängsel', 'Klassisk: Avgränsning. Symbolik: Hinder, skydd.'),
('barriär', 'Klassisk: Hinder. Symbolik: Blockering, gräns.'),
('öppna', 'Klassisk: Öppna, tillåta. Symbolik: Tillgång, möjlighet.'),
('stänga', 'Klassisk: Stänga, avsluta. Symbolik: Avgränsning, slut.'),
('passera', 'Klassisk: Gå igenom. Symbolik: Övergång, genomträngning.'),
('blockeras', 'Klassisk: Hindras. Symbolik: Hinder, oförmåga.'),
('fastna', 'Klassisk: Hållas kvar, blockeras. Symbolik: Fångenskap, hinder.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 6. KONTROLL, BALANS OCH STABILITET ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('balans', 'Klassisk: Jämvikt. Symbolik: Stabilitet, centrum.'),
('kontroll', 'Klassisk: Styrning. Symbolik: Makt, trygghet.'),
('fäste', 'Klassisk: Grepp, stöd. Symbolik: Förankring, säkerhet.'),
('halka', 'Klassisk: Tappa grepp. Symbolik: Instabilitet, risk.'),
('tappa', 'Klassisk: Förlora grepp. Symbolik: Tappad kontroll, förlust.'),
('lossna', 'Klassisk: Släppa, frigöra. Symbolik: Frigörelse, förlust.'),
('vingla', 'Klassisk: Ostadig. Symbolik: Instabilitet, osäkerhet.'),
('bära', 'Klassisk: Bära, hålla. Symbolik: Ansvar, stöd.'),
('hålla', 'Klassisk: Greppa, behålla. Symbolik: Kontroll, skydd.'),
('släppa', 'Klassisk: Frigöra. Symbolik: Avslut, frigörelse.'),
('stöd', 'Klassisk: Stöd, bära. Symbolik: Trygghet, grund.'),
('stabil', 'Klassisk: Fast, säker. Symbolik: Trygghet, grund.'),
('ostadig', 'Klassisk: Växlande. Symbolik: Instabilitet, osäkerhet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 7. RUMSLIGA MILJÖER OCH POSITIONER ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('högst upp', 'Klassisk: Toppen. Symbolik: Överordning, mål.'),
('längst ner', 'Klassisk: Botten. Symbolik: Grund, det nedre.'),
('mitten', 'Klassisk: Centrum. Symbolik: Kärna, balans.'),
('utkanten', 'Klassisk: Rand, kant. Symbolik: Marginal, gräns.'),
('hörn', 'Klassisk: Hörn, vinkel. Symbolik: Gräns, dold plats.'),
('botten', 'Klassisk: Nederst. Symbolik: Grund, djup.'),
('toppen', 'Klassisk: Överst. Symbolik: Mål, höjd.'),
('djup', 'Klassisk: Djup, nedre. Symbolik: Dolda krafter, grund.'),
('yta', 'Klassisk: Yta, över. Symbolik: Synligt, yttre.'),
('insida', 'Klassisk: Inre. Symbolik: Dolt, centrum.'),
('utsida', 'Klassisk: Yttre. Symbolik: Synligt, yttre.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 8. KRAFT, TVÅNG OCH PASSIVITET ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('tvingas', 'Klassisk: Yttre tvång. Symbolik: Maktlöshet, motstånd.'),
('tryckas', 'Klassisk: Pressas. Symbolik: Press, begränsning.'),
('knuffas', 'Klassisk: Kastas, skjuts. Symbolik: Yttre kraft.'),
('fångas', 'Klassisk: Fångas, hållas. Symbolik: Fångenskap, begränsning.'),
('kvarhållas', 'Klassisk: Hållas kvar. Symbolik: Fångenskap, begränsning.'),
('kunna', 'Klassisk: Förmåga. Symbolik: Agency, kontroll.'),
('vilja', 'Klassisk: Önskan. Symbolik: Intentionalitet, vilja.'),
('försöka', 'Klassisk: Försök. Symbolik: Intentionalitet, vilja.'),
('misslyckas', 'Klassisk: Inte lyckas. Symbolik: Hindrande, förlust.'),
('lyckas', 'Klassisk: Lyckas. Symbolik: Genomförande, genomträngning.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 9. LJUS, SIKT OCH ORIENTERBARHET ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('ljust', 'Klassisk: Ljus, synligt. Symbolik: Klarhet, insikt.'),
('mörkt', 'Klassisk: Mörker, okänt. Symbolik: Det dolda, mysterium.'),
('klarhet', 'Klassisk: Tydlighet. Symbolik: Förståelse, insikt.'),
('suddig', 'Klassisk: Otydlig. Symbolik: Oklarhet, förvirring.'),
('blind', 'Klassisk: Inte se. Symbolik: Ovetenhet, förnekelse.'),
('se', 'Klassisk: Se, uppfatta. Symbolik: Insikt, medvetande.'),
('lysa', 'Klassisk: Ge ljus. Symbolik: Vägledning, insikt.'),
('blända', 'Klassisk: Blända, överväldiga. Symbolik: Överväldigande, uppenbarelse.'),
('glimma', 'Klassisk: Glimta. Symbolik: Tillfällig insikt, hopp.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 10. VATTENRÖRELSE OCH MILJÖDYNAMIK ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('ström', 'Klassisk: Flöde, kraft. Symbolik: Emotionell intensitet, rörelse.'),
('drunkna', 'Klassisk: Förlora sig i vatten. Symbolik: Översvämning, undergång.'),
('flyta', 'Klassisk: Bäras av vatten. Symbolik: Lätthet, överlåtande.'),
('översvämning', 'Klassisk: Översvämning. Symbolik: Överväldigande, emotionell intensitet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 11. SOCIAL RIKTNING OCH RELATIONER ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('följa', 'Klassisk: Följa efter. Symbolik: Lydnad, vägledning.'),
('leda', 'Klassisk: Visa väg. Symbolik: Vägledning, ansvar.'),
('lämna', 'Klassisk: Lämna, gå. Symbolik: Separation, avslut.'),
('återvända', 'Klassisk: Komma tillbaka. Symbolik: Återkomst, cykel.'),
('möta', 'Klassisk: Möta, träffa. Symbolik: Konfrontation, möte.'),
('gömma', 'Klassisk: Dölja sig. Symbolik: Skydd, undvikande.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
