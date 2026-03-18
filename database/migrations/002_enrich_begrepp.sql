-- Migration: Ytterligare berikning av Begrepp
-- Fyller på med rikare beskrivningar och fler symboler
-- Inga schemaändringar – endast innehåll
-- Ref: docs/ARCHITECTURE_PRINCIPLES.md

USE reflektionsarkiv;

-- Berika befintliga beskrivningar med mer nuance och källreferens
UPDATE Begrepp SET Beskrivning = 'Klassisk: Ofta kopplad till varning eller förvandling; Artemidoros nämner ormen som budbärare. Jungianskt: Symbol för instinkt, rädsla, sexualitet, förändring eller det dolda; förnyelse via ömsning; kundalini-energi. Symbolik: Liv-död-dualitet, visdom, läkning, helande stav.' WHERE Ord = 'orm';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Känsloliv, flytande tillstånd; drömmar om vatten ofta kopplade till emotionell stabilitet eller rörelse. Jungianskt: Det omedvetna, känslor, djup, rening; kollektivt omedvetet som "hav". Symbolik: Ursprung, liv, övergång, rening.' WHERE Ord = 'vatten';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Helig plats, sökande; tempel som drömplats kan betyda inre helighet eller sökande efter mening. Jungianskt: Inre rum, själv, det heliga; mandala som centrum. Symbolik: Skydd, andlighet, centrum, tröskel till det högre.' WHERE Ord = 'tempel';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Mörker, okänt; svart i drömmar ofta kopplat till det dolda eller hotfullt. Jungianskt: Skugga, det omedvetna, natt; shadow-archetypen. Symbolik: Djup, mysterium, dold potential, inkarnation.' WHERE Ord = 'svart';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Förstörelse eller rening; eld i drömmar kan vara både hot och renande kraft. Jungianskt: Energi, vilja, passion, transformation; libido som "eld". Symbolik: Rening, livskraft, förbränning, uppvaknande.' WHERE Ord = 'eld';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Livets väg, övergång; resor i drömmar ofta symbol för livsfas eller förändring. Jungianskt: Individuationsprocess, utveckling; vägen mot självet. Symbolik: Förändring, sökande, livsresa, pilgrimsfärd.' WHERE Ord = 'resa';

UPDATE Begrepp SET Beskrivning = 'Klassisk: Oändlighet, ursprung; hav som gräns mot okänt. Jungianskt: Kollektivt omedvetet, ursprungliga krafter; "det stora havet". Symbolik: Djup, okänt, livets källa, oändlighet.' WHERE Ord = 'hav';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Slut, förintelse; aska som rest efter eld. Jungianskt: Efter transformation; phoenix-motivet. Symbolik: Förbränning, renande, ny början, från aska till nytt.' WHERE Ord = 'aska';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Okänt, rädsla; mörker som motpol till ljus. Jungianskt: Skugga, omedvetet; det som ännu inte blivit medvetet. Symbolik: Det dolda, natt, mysterium, potential.' WHERE Ord = 'mörker';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Insikt, sanning; ljus som vägledning. Jungianskt: Medvetande, förståelse; illumination. Symbolik: Vägledning, hopp, klarhet, upplysning.' WHERE Ord = 'ljus';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Vila, död; natt som övergång. Jungianskt: Omedvetet, dröm; nattens "andra verklighet". Symbolik: Övergång, det dolda, vila, inkubation.' WHERE Ord = 'natt';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Själ, identitet; hus som kropp eller psyke. Jungianskt: Psyket, jag; "inre rum". Symbolik: Inre rum, trygghet, familj, själv.' WHERE Ord = 'hus';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Övergång, möjlighet; dörr som tröskel. Jungianskt: Tröskel till nytt; liminalitet. Symbolik: Val, förändring, tillgång, ny fas.' WHERE Ord = 'dörr';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Vildmark, okänt; skog som vilse. Jungianskt: Omedvetet, vilse; "mörk skog" i Dantes Inferno. Symbolik: Mysterium, natur, sökande, initiation.' WHERE Ord = 'skog';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Stabilitet, höjd; berg som mål eller hinder. Jungianskt: Själv, mål; individuation som bestigning. Symbolik: Utmaning, centrum, fasthet, transcendens.' WHERE Ord = 'berg';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Frihet, ande; fåglar som budbärare. Jungianskt: Transcendens, meddelare; anima som duva. Symbolik: Själ, frihet, högre perspektiv, andlighet.' WHERE Ord = 'fågel';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Kaos, rening; storm som upprivning. Jungianskt: Emotionell upprivning; kaos före ordning. Symbolik: Förändring, kraft, kaos, rening.' WHERE Ord = 'storm';
UPDATE Begrepp SET Beskrivning = 'Klassisk: Slut, övergång; död i drömmar sällan bokstavlig. Jungianskt: Ego-död, förvandling; slut på en fas. Symbolik: Avslut, förnyelse, okänt, initiering.' WHERE Ord = 'död';

-- Nya begrepp – vanliga drömsymboler och reflektionsteman
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('dröm', 'Klassisk: Drömmen som budbärare; Artemidoros: drömmar som vägledning. Jungianskt: Omedvetets språk; kompensation, förberedelse. Symbolik: Kommunikation med inre, inkubation.'),
('fader', 'Klassisk: Auktoritet, lag, ordning. Jungianskt: Fader-archetypen; logos, ande. Symbolik: Struktur, skydd, begränsning, transcendens.'),
('fisk', 'Klassisk: Kristendom: kristus-symbol; tidigare: fruktbarhet. Jungianskt: Innehållet i omedvetet; djupt dold kunskap. Symbolik: Liv, dold visdom, det omedvetna.'),
('sten', 'Klassisk: Stabilitet, fundament; "sten som byggare förkastade". Jungianskt: Själv som "lapis"; det oföränderliga. Symbolik: Fasthet, grund, uthållighet.'),
('träd', 'Klassisk: Liv, växt; världsträdet i myter. Jungianskt: Individuationsprocess; rötter och kronor. Symbolik: Tillväxt, koppling jord-himmel, livets träd.'),
('blomma', 'Klassisk: Skönhet, förgänglighet; blomster i drömmar ofta kopplade till känslor. Jungianskt: Själv i blomstring; mandala. Symbolik: Potential, skönhet, förvandling.'),
('sjö', 'Klassisk: Spegel, stillhet; sjö som reflekterande yta. Jungianskt: Omedvetet som spegel; Narcissus-motivet. Symbolik: Djup, spegel, inre stillhet.'),
('sol', 'Klassisk: Liv, kraft, gudomlighet. Jungianskt: Själv, medvetande; solen som centrum. Symbolik: Ljus, vitalitet, maskulint, klarhet.'),
('måne', 'Klassisk: Cykler, kvinnligt; månens växlingar. Jungianskt: Anima, det receptiva; omedvetet. Symbolik: Känslor, cykel, feminint, natt.'),
('röd', 'Klassisk: Passion, blod, liv. Jungianskt: Libido, passion; "det röda" i alkemisk tradition. Symbolik: Livskraft, passion, varning.'),
('blå', 'Klassisk: Himmel, vatten, lugn. Jungianskt: Andlighet, transcendens. Symbolik: Djup, tro, stillhet.'),
('grön', 'Klassisk: Natur, växt, hopp. Symbolik: Nytt liv, natur, läkning.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
