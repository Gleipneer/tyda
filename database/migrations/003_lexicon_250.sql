-- Migration: Utöka lexikon till minst 250 begrepp
-- Källmedveten: Klassisk/Jungianskt/Symbolik – tolkningsramar, inte objektiv sanning
-- Ref: docs/ARCHITECTURE_PRINCIPLES.md, docs/SOURCE_STRATEGY.md
-- KÖR MED: python backend/scripts/run_migration_utf8.py (UTF-8 säkert)

USE reflektionsarkiv;

-- ========== 1. ELEMENT / NATUR ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('regn', 'Klassisk: Rening, livgivande; regn som välsignelse. Jungianskt: Känsloström, rening; emotionell genomträngning. Symbolik: Liv, förnyelse, tårar.'),
('is', 'Klassisk: Stelhet, frysa. Jungianskt: Frysta känslor; defensiv kyla. Symbolik: Stillastående, kyla, skydd.'),
('vind', 'Klassisk: Ande, rörelse; vind som budbärare. Jungianskt: Pneuma; andlig rörelse. Symbolik: Förändring, ande, osynlig kraft.'),
('gryning', 'Klassisk: Ny början; övergång från natt till dag. Jungianskt: Medvetandets gryning; uppvaknande. Symbolik: Hopp, ny fas, illumination.'),
('skymning', 'Klassisk: Övergång; dag till natt. Jungianskt: Nedstigning till omedvetet; liminalitet. Symbolik: Avslut, mysterium, övergång.'),
('dimma', 'Klassisk: Oklarhet, vilse. Jungianskt: Omedvetet som dimma. Symbolik: Osäkerhet, sökande.'),
('regnbåge', 'Klassisk: Förbund, löfte. Jungianskt: Bro mellan världar. Symbolik: Hopp, förbindelse, färg.'),
('åska', 'Klassisk: Gudomlig röst; varning. Jungianskt: Emotionell explosion; genomträngande insikt. Symbolik: Kraft, omvandling.'),
('moln', 'Klassisk: Skymning, fördoldhet. Jungianskt: Omedvetet som täcker. Symbolik: Förändring, övergång.'),
('stjärna', 'Klassisk: Vägledning, öde. Jungianskt: Själv som ljus; individuation. Symbolik: Hopp, riktning, transcendens.'),
('horisont', 'Klassisk: Gräns, möjlighet. Symbolik: Framtid, potential, okänt.'),
('klippa', 'Klassisk: Stabilitet, fundament. Jungianskt: Oföränderligt; lapis. Symbolik: Grund, säkerhet.'),
('ö', 'Klassisk: Isolering, skydd. Jungianskt: Själv som ö i omedvetet. Symbolik: Tillflykt, ensamhet.'),
('strand', 'Klassisk: Gräns mellan element. Jungianskt: Liminal zon; medvetet-omedvetet. Symbolik: Övergång, möte.'),
('källa', 'Klassisk: Ursprung, liv. Jungianskt: Omedvetets källa. Symbolik: Ursprung, renhet, början.'),
('bäck', 'Klassisk: Litet flöde. Symbolik: Livsflöde, stillhet.'),
('dagg', 'Klassisk: Förgänglighet, morgon. Symbolik: Renhet, nytt.'),
('frost', 'Klassisk: Kyla, stillastående. Symbolik: Paus, vinter.'),
('lava', 'Klassisk: Undergångs kraft. Jungianskt: Passion som flöde. Symbolik: Transformation, fara.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 2. DJUR ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('häst', 'Klassisk: Kraft, frihet; häst som transport. Jungianskt: Libido; instinktiv kraft. Symbolik: Vitalitet, resa, vilja.'),
('varg', 'Klassisk: Vildhet, ensamhet. Jungianskt: Skugga; det vilda jaget. Symbolik: Instinkt, frihet, hot.'),
('björn', 'Klassisk: Kraft, vildmark. Jungianskt: Arketyp; moderlig vildhet. Symbolik: Styrka, skydd, vinter.'),
('hjort', 'Klassisk: Renhet, jakt. Jungianskt: Anima; det sköna. Symbolik: Sårbarhet, natur.'),
('lejon', 'Klassisk: Kunglighet, mod. Jungianskt: Sol; maskulin kraft. Symbolik: Makt, mod, sol.'),
('uggla', 'Klassisk: Visdom, natt. Jungianskt: Skugga; nattens kunskap. Symbolik: Insikt, mysterium.'),
('korp', 'Klassisk: Budbärare, död. Jungianskt: Skugga; transformation. Symbolik: Övergång, meddelare.'),
('insekt', 'Klassisk: Förgänglighet, små krafter. Symbolik: Detalj, process.'),
('spindel', 'Klassisk: Fångenskap, väv. Jungianskt: Anima som fångar. Symbolik: Nätverk, kreativitet.'),
('bi', 'Klassisk: Arbete, fruktbarhet. Jungianskt: Kollektivt; samarbete. Symbolik: Produktion, sötma.'),
('fjäril', 'Klassisk: Förvandling, själ. Jungianskt: Psyche; transformation. Symbolik: Metamorfos, skönhet.'),
('delfin', 'Klassisk: Räddning, vänlighet. Symbolik: Vägledning, hav.'),
('val', 'Klassisk: Djupet, storhet. Jungianskt: Kollektivt omedvetet. Symbolik: Storhet, mysterium.'),
('häger', 'Klassisk: Tålamod, stillhet. Symbolik: Väntan, rening.'),
('svan', 'Klassisk: Renhet, transformation. Jungianskt: Anima; det sköna. Symbolik: Förvandling, skönhet.'),
('duva', 'Klassisk: Fred, ande. Jungianskt: Anima; helig ande. Symbolik: Fred, kärlek.'),
('örn', 'Klassisk: Höjd, överblick. Jungianskt: Transcendens; sol. Symbolik: Frihet, perspektiv.'),
('orm', 'Klassisk: Ofta kopplad till varning eller förvandling; Artemidoros nämner ormen som budbärare. Jungianskt: Symbol för instinkt, rädsla, sexualitet, förändring eller det dolda; förnyelse via ömsning; kundalini-energi. Symbolik: Liv-död-dualitet, visdom, läkning, helande stav.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 3. PLATSER / STRUKTURER ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('rum', 'Klassisk: Inre plats; rum som psyke. Jungianskt: Del av jag; inre rum. Symbolik: Privat, identitet.'),
('källare', 'Klassisk: Det dolda, grund. Jungianskt: Omedvetet; det nedre. Symbolik: Dolda krafter, grund.'),
('vindsvåning', 'Klassisk: Högre nivå; förråd, minne. Jungianskt: Överbyggnad; andlighet. Symbolik: Överblick, dolt.'),
('port', 'Klassisk: Ingång, tröskel. Jungianskt: Liminalitet; passage. Symbolik: Övergång, val.'),
('mur', 'Klassisk: Skydd, begränsning. Jungianskt: Ego; försvar. Symbolik: Gräns, hinder.'),
('stad', 'Klassisk: Civilisation, samhälle. Jungianskt: Persona; kollektivt. Symbolik: Ordning, människor.'),
('havskust', 'Klassisk: Gräns mot okänt. Jungianskt: Medvetet-omedvetet. Symbolik: Övergång, möte.'),
('öken', 'Klassisk: Prövning, tomhet. Jungianskt: Öde; sökande. Symbolik: Renhet, ensamhet.'),
('trädgård', 'Klassisk: Paradis, odling. Jungianskt: Själv i utveckling. Symbolik: Skönhet, växt.'),
('grotta', 'Klassisk: Undergång, mysterium. Jungianskt: Omedvetet; moder. Symbolik: Initiation, dold kunskap.'),
('torn', 'Klassisk: Höjd, isolering. Jungianskt: Transcendens; ego. Symbolik: Överblick, ensamhet.'),
('fängelse', 'Klassisk: Begränsning, straff. Jungianskt: Ego-fängelse; komplex. Symbolik: Fångenskap, hinder.'),
('marknad', 'Klassisk: Utbyte, värde. Symbolik: Val, handel.'),
('bibliotek', 'Klassisk: Kunskap, arkiv. Symbolik: Minne, visdom.'),
('sjukhus', 'Klassisk: Läkning, sårbarhet. Symbolik: Vård, helande.'),
('skola', 'Klassisk: Lärande, initiering. Symbolik: Utveckling, kunskap.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 4. OBJEKT ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('svärd', 'Klassisk: Makt, skärpa; Excalibur-motivet. Jungianskt: Logos; skiljande kraft. Symbolik: Beslut, kraft, sanning.'),
('bok', 'Klassisk: Kunskap, öde. Jungianskt: Omedvetet som text. Symbolik: Visdom, berättelse.'),
('lampa', 'Klassisk: Ljus, vägledning. Jungianskt: Medvetande; illumination. Symbolik: Insikt, hopp.'),
('kärl', 'Klassisk: Mottagande, innehåll. Jungianskt: Anima; det receptiva. Symbolik: Bevarande, mottaglighet.'),
('båt', 'Klassisk: Övergång, resa. Jungianskt: Ego i omedvetet; Charon. Symbolik: Passage, övergång.'),
('stol', 'Klassisk: Plats, auktoritet. Symbolik: Position, vila.'),
('säng', 'Klassisk: Vila, död, sexualitet. Jungianskt: Inkubation; dröm. Symbolik: Övergång, intimitet.'),
('klocka', 'Klassisk: Tid, dödlighet. Symbolik: Cykel, begränsning.'),
('mask', 'Klassisk: Dold identitet; persona. Jungianskt: Persona; det vi visar. Symbolik: Skydd, döljande.'),
('mantel', 'Klassisk: Skydd, värdighet. Symbolik: Identitet, skydd.'),
('spjut', 'Klassisk: Riktning, kraft. Symbolik: Intentionalitet.'),
('hjul', 'Klassisk: Cykel, öde. Symbolik: Rullande, förändring.'),
('pil', 'Klassisk: Riktning, kraft. Symbolik: Intentionalitet.'),
('kors', 'Klassisk: Kristendom: kristus; förr: möte. Symbolik: Val, centrum, offer.'),
('stav', 'Klassisk: Vägledning, makt. Symbolik: Stöd, auktoritet.'),
('nyckel', 'Klassisk: Öppning, lösning. Jungianskt: Tillgång till dolt. Symbolik: Kunskap, makt, frigörelse.'),
('ring', 'Klassisk: Enhet, förbindelse. Jungianskt: Helhet, mandala. Symbolik: Löfte, cykel, slutenhet.'),
('krona', 'Klassisk: Makt, värdighet. Jungianskt: Själv, självrealisering. Symbolik: Auktoritet, fullbordan.'),
('spegel', 'Klassisk: Självinsikt. Jungianskt: Självreflektion, skugga. Symbolik: Identitet, sanning, dubbelhet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 5. MÄNNISKLIGA FIGURER / RELATIONER ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('främling', 'Klassisk: Okänd, budbärare. Jungianskt: Skugga; det okända jaget. Symbolik: Möte, nytt.'),
('vän', 'Klassisk: Gemenskap, stöd. Symbolik: Förbindelse, tillit.'),
('älskare', 'Klassisk: Passion, förening. Jungianskt: Anima/animus; koniunctio. Symbolik: Kärlek, helhet.'),
('kung', 'Klassisk: Auktoritet, ordning. Jungianskt: Fader-archetypen; logos. Symbolik: Struktur, makt.'),
('drottning', 'Klassisk: Moderskap, mottaglighet. Jungianskt: Anima; det receptiva. Symbolik: Omsorg, makt.'),
('vägvisare', 'Klassisk: Ledare, mentor. Jungianskt: Gammal vis; själv. Symbolik: Vägledning, wisdom.'),
('skugga', 'Klassisk: Dold sida. Jungianskt: Shadow-archetypen; det förnekade. Symbolik: Mörker, potential.'),
('tvilling', 'Klassisk: Dubbelhet, spegel. Jungianskt: Själv och skugga. Symbolik: Identitet, dubbelhet.'),
('moder', 'Klassisk: Ursprung, omsorg. Jungianskt: Anima, det receptiva. Symbolik: Källa, trygghet, jord.'),
('fader', 'Klassisk: Auktoritet, lag, ordning. Jungianskt: Fader-archetypen; logos, ande. Symbolik: Struktur, skydd, transcendens.'),
('barn', 'Klassisk: Nytt, oskuldsfullt. Jungianskt: Själv i utveckling. Symbolik: Potential, ny början, sårbarhet.'),
('gammal', 'Klassisk: Visdom, erfarenhet. Jungianskt: Gammal vis; själv. Symbolik: Wisdom, slut.'),
('präst', 'Klassisk: Andlig auktoritet. Symbolik: Förmedling, heligt.'),
('krigare', 'Klassisk: Kamp, vilja. Symbolik: Kraft, försvar.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 6. PROCESSER / TILLSTÅND ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('fall', 'Klassisk: Nedstigning, förlust. Jungianskt: Nedstigning till omedvetet. Symbolik: Övergång, humilitas.'),
('uppstigning', 'Klassisk: Stigning, transcendens. Jungianskt: Individuationsprocess. Symbolik: Förändring, högre.'),
('förlust', 'Klassisk: Sorg, förändring. Jungianskt: Ego-förlust; förberedelse. Symbolik: Avslut, lärande.'),
('återkomst', 'Klassisk: Hemkomst, cykel. Jungianskt: Återintegration. Symbolik: Fullbordan, hem.'),
('sökande', 'Klassisk: Pilgrim, resa. Jungianskt: Individuationsprocess. Symbolik: Mysterium, väg.'),
('vila', 'Klassisk: Vila, återhämtning. Symbolik: Paus, inkubation.'),
('fångenskap', 'Klassisk: Begränsning, komplex. Jungianskt: Ego-fängelse. Symbolik: Hinder, lärande.'),
('frigörelse', 'Klassisk: Befrielse, frihet. Jungianskt: Ego-transcendens. Symbolik: Frihet, nytt.'),
('resa', 'Klassisk: Livets väg, övergång; resor i drömmar ofta symbol för livsfas eller förändring. Jungianskt: Individuationsprocess, utveckling; vägen mot självet. Symbolik: Förändring, sökande, livsresa, pilgrimsfärd.'),
('död', 'Klassisk: Slut, övergång; död i drömmar sällan bokstavlig. Jungianskt: Ego-död, förvandling; slut på en fas. Symbolik: Avslut, förnyelse, okänt, initiering.'),
('födelse', 'Klassisk: Början, nytt. Jungianskt: Ny fas. Symbolik: Ursprung, potential, start.'),
('ömsning', 'Klassisk: Förvandling. Jungianskt: Förnyelse, orm-symbolik. Symbolik: Överge gammalt, nytt skinn.'),
('förvandling', 'Klassisk: Metamorfos. Jungianskt: Individuationsprocess. Symbolik: Förändring, nytt.'),
('väntan', 'Klassisk: Tålamod, förberedelse. Symbolik: Paus, förväntan.'),
('flykt', 'Klassisk: Undanflykt, rädsla. Symbolik: Undvikande, överlevnad.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 7. FÄRGER / KVALITETER ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('guld', 'Klassisk: Värde, sol. Jungianskt: Själv; lapis. Symbolik: Fullbordan, värde.'),
('silver', 'Klassisk: Måne, feminint. Symbolik: Receptivitet, värde.'),
('blek', 'Klassisk: Död, sjukdom. Symbolik: Svaghet, övergång.'),
('glödande', 'Klassisk: Passion, eld. Symbolik: Intensitet, liv.'),
('kall', 'Klassisk: Kyla, stillastående. Symbolik: Distans, frysa.'),
('varm', 'Klassisk: Liv, passion. Symbolik: Nära, kärlek.'),
('tom', 'Klassisk: Tomhet, potential. Jungianskt: Vacuum; förberedelse. Symbolik: Möjlighet, renhet.'),
('full', 'Klassisk: Mättnad, helhet. Symbolik: Fullbordan, tillräckligt.'),
('svart', 'Klassisk: Mörker, okänt; svart i drömmar ofta kopplat till det dolda eller hotfullt. Jungianskt: Skugga, det omedvetna, natt; shadow-archetypen. Symbolik: Djup, mysterium, dold potential, inkarnation.'),
('vit', 'Klassisk: Renhet, ljus. Jungianskt: Medvetande, renhet. Symbolik: Oskuld, ny början, ljus.'),
('röd', 'Klassisk: Passion, blod, liv. Jungianskt: Libido, passion; "det röda" i alkemisk tradition. Symbolik: Livskraft, passion, varning.'),
('blå', 'Klassisk: Himmel, vatten, lugn. Jungianskt: Andlighet, transcendens. Symbolik: Djup, tro, stillhet.'),
('grön', 'Klassisk: Natur, växt, hopp. Symbolik: Nytt liv, natur, läkning.'),
('gul', 'Klassisk: Sol, ljus. Symbolik: Vitalitet, medvetande.'),
('brun', 'Klassisk: Jord, jordnära. Symbolik: Grund, stabilitet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 8. SYMBOLTUNGA MOTIV ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('vattenfall', 'Klassisk: Kraft, överflöd. Jungianskt: Känsloström; överväldigande. Symbolik: Kraft, rening.'),
('labyrint', 'Klassisk: Förvillande, sökande. Jungianskt: Individuationsprocess; inre väg. Symbolik: Mysterium, centrum.'),
('cirkel', 'Klassisk: Helhet, cykel. Jungianskt: Mandala; själv. Symbolik: Slutenhet, helhet.'),
('centrum', 'Klassisk: Kärna, mitt. Jungianskt: Själv; mandala-centrum. Symbolik: Fokus, helhet.'),
('havsdjup', 'Klassisk: Okänt, ursprung. Jungianskt: Kollektivt omedvetet. Symbolik: Mysterium, djup.'),
('stormmoln', 'Klassisk: Hot, förändring. Symbolik: Kaos, rening.'),
('eldsvåda', 'Klassisk: Förstörelse, rening. Symbolik: Transformation, kaos.'),
('spegelbild', 'Klassisk: Dubbelhet, spegel. Jungianskt: Skugga; det reflekterade. Symbolik: Identitet, sanning.'),
('frö', 'Klassisk: Potential, början. Jungianskt: Själv i utveckling. Symbolik: Nytt liv, potential.'),
('rot', 'Klassisk: Förankring, ursprung. Jungianskt: Omedvetet; grund. Symbolik: Förbindelse, grund.'),
('kronblad', 'Klassisk: Blomma, skönhet. Symbolik: Förgänglighet, skönhet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);

-- ========== 9. Ytterligare begrepp för att nå 250+ ==========
INSERT INTO Begrepp (Ord, Beskrivning) VALUES
('dröm', 'Klassisk: Drömmen som budbärare; Artemidoros: drömmar som vägledning. Jungianskt: Omedvetets språk; kompensation, förberedelse. Symbolik: Kommunikation med inre, inkubation.'),
('vatten', 'Klassisk: Känsloliv, flytande tillstånd; drömmar om vatten ofta kopplade till emotionell stabilitet eller rörelse. Jungianskt: Det omedvetna, känslor, djup, rening; kollektivt omedvetet som "hav". Symbolik: Ursprung, liv, övergång, rening.'),
('eld', 'Klassisk: Förstörelse eller rening; eld i drömmar kan vara både hot och renande kraft. Jungianskt: Energi, vilja, passion, transformation; libido som "eld". Symbolik: Rening, livskraft, förbränning, uppvaknande.'),
('hav', 'Klassisk: Oändlighet, ursprung; hav som gräns mot okänt. Jungianskt: Kollektivt omedvetet, ursprungliga krafter; "det stora havet". Symbolik: Djup, okänt, livets källa, oändlighet.'),
('flod', 'Klassisk: Tid, flöde. Jungianskt: Livsflöde, känsloström. Symbolik: Övergång, förändring, riktning.'),
('storm', 'Klassisk: Kaos, rening; storm som upprivning. Jungianskt: Emotionell upprivning; kaos före ordning. Symbolik: Förändring, kraft, kaos, rening.'),
('tempel', 'Klassisk: Helig plats, sökande; tempel som drömplats kan betyda inre helighet eller sökande efter mening. Jungianskt: Inre rum, själv, det heliga; mandala som centrum. Symbolik: Skydd, andlighet, centrum, tröskel till det högre.'),
('kyrka', 'Klassisk: Andlighet, gemenskap. Jungianskt: Inre helighet, själv. Symbolik: Skydd, tradition, högre mening.'),
('hus', 'Klassisk: Själ, identitet; hus som kropp eller psyke. Jungianskt: Psyket, jag; "inre rum". Symbolik: Inre rum, trygghet, familj, själv.'),
('dörr', 'Klassisk: Övergång, möjlighet; dörr som tröskel. Jungianskt: Tröskel till nytt; liminalitet. Symbolik: Val, förändring, tillgång, ny fas.'),
('bro', 'Klassisk: Övergång, förbindelse. Jungianskt: Länk mellan medvetet och omedvetet. Symbolik: Övergång, möte.'),
('väg', 'Klassisk: Livsriktning. Jungianskt: Individuationsväg. Symbolik: Val, resa, framtid.'),
('skog', 'Klassisk: Vildmark, okänt; skog som vilse. Jungianskt: Omedvetet, vilse; "mörk skog" i Dantes Inferno. Symbolik: Mysterium, natur, sökande, initiation.'),
('aska', 'Klassisk: Slut, förintelse; aska som rest efter eld. Jungianskt: Efter transformation; phoenix-motivet. Symbolik: Förbränning, renande, ny början, från aska till nytt.'),
('sot', 'Klassisk: Förorening, mörker. Symbolik: Relaterat till eld, förbränning, mörker.'),
('mörker', 'Klassisk: Okänt, rädsla; mörker som motpol till ljus. Jungianskt: Skugga, omedvetet; det som ännu inte blivit medvetet. Symbolik: Det dolda, natt, mysterium, potential.'),
('ljus', 'Klassisk: Insikt, sanning; ljus som vägledning. Jungianskt: Medvetande, förståelse; illumination. Symbolik: Vägledning, hopp, klarhet, upplysning.'),
('natt', 'Klassisk: Vila, död; natt som övergång. Jungianskt: Omedvetet, dröm; nattens "andra verklighet". Symbolik: Övergång, det dolda, vila, inkubation.'),
('himmel', 'Klassisk: Högre makt, andlighet. Jungianskt: Transcendens. Symbolik: Oändlighet, hopp, fader.'),
('jord', 'Klassisk: Materia, kropp. Jungianskt: Anima, det receptiva. Symbolik: Grund, moder, verklighet.'),
('berg', 'Klassisk: Stabilitet, höjd; berg som mål eller hinder. Jungianskt: Själv, mål; individuation som bestigning. Symbolik: Utmaning, centrum, fasthet, transcendens.'),
('sten', 'Klassisk: Stabilitet, fundament; "sten som byggare förkastade". Jungianskt: Själv som "lapis"; det oföränderliga. Symbolik: Fasthet, grund, uthållighet.'),
('träd', 'Klassisk: Liv, växt; världsträdet i myter. Jungianskt: Individuationsprocess; rötter och kronor. Symbolik: Tillväxt, koppling jord-himmel, livets träd.'),
('blomma', 'Klassisk: Skönhet, förgänglighet; blomster i drömmar ofta kopplade till känslor. Jungianskt: Själv i blomstring; mandala. Symbolik: Potential, skönhet, förvandling.'),
('fågel', 'Klassisk: Frihet, ande; fåglar som budbärare. Jungianskt: Transcendens, meddelare; anima som duva. Symbolik: Själ, frihet, högre perspektiv, andlighet.'),
('fisk', 'Klassisk: Kristendom: kristus-symbol; tidigare: fruktbarhet. Jungianskt: Innehållet i omedvetet; djupt dold kunskap. Symbolik: Liv, dold visdom, det omedvetna.'),
('hund', 'Klassisk: Trohet, vakt. Jungianskt: Instinkt, lojalitet. Symbolik: Skydd, vänskap, instinkt.'),
('katt', 'Klassisk: Oberoende, natt. Jungianskt: Det feminina, mysterium. Symbolik: Självständighet, natt, magi.'),
('blod', 'Klassisk: Liv, släkt. Jungianskt: Livskraft, passion. Symbolik: Essens, offer, förbindelse.'),
('sol', 'Klassisk: Liv, kraft, gudomlighet. Jungianskt: Själv, medvetande; solen som centrum. Symbolik: Ljus, vitalitet, maskulint, klarhet.'),
('måne', 'Klassisk: Cykler, kvinnligt; månens växlingar. Jungianskt: Anima, det receptiva; omedvetet. Symbolik: Känslor, cykel, feminint, natt.'),
('sjö', 'Klassisk: Spegel, stillhet; sjö som reflekterande yta. Jungianskt: Omedvetet som spegel; Narcissus-motivet. Symbolik: Djup, spegel, inre stillhet.'),
('fönster', 'Klassisk: Insikt, utsikt. Symbolik: Perspektiv, möjlighet, gräns.'),
('grav', 'Klassisk: Slut, vila. Jungianskt: Undergång, transformation. Symbolik: Avslut, begravning, nytt.'),
('trappa', 'Klassisk: Stigning, nedstigning. Jungianskt: Utvecklingsnivåer. Symbolik: Övergång, arbete, framsteg.'),
('havsdjur', 'Klassisk: Djupet, okänt. Symbolik: Relaterat till hav, det omedvetna, dolda krafter.'),
('havsvåg', 'Klassisk: Rörlighet, kraft. Symbolik: Relaterat till hav, rörelse, känslor.'),
('snö', 'Klassisk: Renhet, stillhet; snö som täckande. Jungianskt: Frysta känslor; vit renhet. Symbolik: Tystnad, vinter, renhet.'),
('rök', 'Klassisk: Försvinnande, eld. Symbolik: Övergång, förbränning.'),
('flamma', 'Klassisk: Eld, passion. Jungianskt: Libido; livskraft. Symbolik: Intensitet, transformation.'),
('öga', 'Klassisk: Insikt, övervakning. Symbolik: Seende, medvetande.'),
('hand', 'Klassisk: Handling, makt. Symbolik: Skapande, kontakt.'),
('fot', 'Klassisk: Grund, rörelse. Symbolik: Förflyttning, stabilitet.'),
('hjärta', 'Klassisk: Kärlek, liv. Symbolik: Känsla, centrum.'),
('tand', 'Klassisk: Aggression, försvar. Symbolik: Kraft, överlevnad.'),
('hår', 'Klassisk: Kraft, identitet. Symbolik: Vitalitet, skönhet.'),
('mat', 'Klassisk: Näring, liv. Symbolik: Mottagande, tillfredsställelse.'),
('vin', 'Klassisk: Fira, blod. Symbolik: Gemenskap, passion.'),
('bröd', 'Klassisk: Liv, näring. Symbolik: Grundläggande, delning.'),
('pengar', 'Klassisk: Värde, energi. Symbolik: Utbyte, makt.'),
('tårar', 'Klassisk: Sorg, rening. Symbolik: Känslor, lättnad.'),
('skratt', 'Klassisk: Glädje, lättnad. Symbolik: Frihet, gemenskap.'),
('tystnad', 'Klassisk: Stillhet, mysterium. Symbolik: Inre, väntan.'),
('röst', 'Klassisk: Budskap, identitet. Symbolik: Uttryck, kall.'),
('musik', 'Klassisk: Harmoni, känsla. Symbolik: Samklang, transcendens.'),
('dans', 'Klassisk: Rörelse, ritual. Symbolik: Förbindelse, uttryck.'),
('målning', 'Klassisk: Skapande, uttryck. Symbolik: Inre bild, projektion.'),
('tunnel', 'Klassisk: Passage, födelse. Jungianskt: Nedstigning; birth canal. Symbolik: Övergång, nytt.'),
('vägg', 'Klassisk: Gräns, skydd. Symbolik: Avgränsning, hinder.'),
('golv', 'Klassisk: Grund, stöd. Symbolik: Stabilitet, underlag.'),
('tröskel', 'Klassisk: Övergång, liminalitet. Symbolik: Passage, val.'),
('grind', 'Klassisk: Ingång, begränsning. Symbolik: Övergång, kontroll.'),
('torg', 'Klassisk: Mötesplats, offentlighet. Symbolik: Gemenskap, utbyte.'),
('gata', 'Klassisk: Väg, riktning. Symbolik: Livsresa, val.'),
('park', 'Klassisk: Natur, vila. Symbolik: Stillhet, skönhet.'),
('fält', 'Klassisk: Öppenhet, potential. Symbolik: Möjlighet, frihet.'),
('äng', 'Klassisk: Natur, växt. Symbolik: Skönhet, stillhet.')
ON DUPLICATE KEY UPDATE Beskrivning = VALUES(Beskrivning);
