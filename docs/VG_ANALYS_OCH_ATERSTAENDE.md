# VG-analys och återstående arbete

## 1. Syfte
Den här filen är:

- en teknisk granskning av projektet mot VG-underlaget
- en handlingsplan för återstående arbete
- en försvarsfil inför redovisning och lärarfrågor

Målet är att avgöra vad som faktiskt redan är uppfyllt, vad som bara är delvis uppfyllt, vad som återstår och vad som inte bör läggas till i onödan.

## 2. Källunderlag
Primär källa för kriterierna:

- `VG/YH_26_planering_databaser (1).pdf`

Granskade filer och delar i repot:

- `reflektionsarkiv.sql`
- `database/migrations/001_expand_begrepp.sql`
- `database/migrations/002_enrich_begrepp.sql`
- `database/migrations/003_lexicon_250.sql`
- `database/migrations/004_add_kansla.sql`
- `database/migrations/005_drop_kommentarer.sql`
- `database/migrations/006_lexicon_extended.sql`
- `database/migrations/007_lexicon_dromtolkning.sql`
- `database/migrations/008_precision_dromtolkning.sql`
- `database/migrations/009_database_truth_consolidation.sql`
- `backend/scripts/run_migration_utf8.py`
- `backend/tests/test_database_truth.py`
- `backend/app/db.py`
- `backend/app/config.py`
- `backend/app/routers/posts.py`
- `backend/app/routers/activity.py`
- `backend/app/routers/users.py`
- `backend/app/repositories/post_repo.py`
- `backend/app/repositories/concept_repo.py`
- `backend/app/repositories/activity_repo.py`
- `backend/app/repositories/analytics_repo.py`
- `backend/app/repositories/user_repo.py`
- `backend/app/schemas/users.py`
- `README.md`
- `.gitignore`
- `KOMPANJON.md`
- `docs/DATABASE_HELP.md`
- `docs/ARCHITECTURE.md`
- `docs/STATUS.md`
- `docs/VERIFICATION_REPORT.md`
- `frontend/public/runbook.md`
- `frontend/src/contexts/ActiveUserContext.tsx`
- `frontend/src/services/posts.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/AboutDatabasePage.tsx`
- `frontend/src/pages/MyRoomPage.tsx`
- `frontend/src/pages/PostDetailPage.tsx`
- `frontend/src/pages/ActivityPage.tsx`

Viktigt:

- Bedömningen nedan bygger bara på sådant som går att verifiera i underlaget ovan.
- Om något inte går att styrka i kod eller dokumentation markeras det som osäkert eller ofullständigt.

## 3. Sammanfattande bedömning
Är projektet idag på G-nivå?

- Ja, tydligt. Databasen har fler än tre sammanlänkade tabeller, är implementerad i MySQL, använder primär- och främmande nycklar, har constraints, trigger, JOINs och GROUP BY, och kan demonstreras via både SQL och applikation.

Är det nära VG?

- Ja, men inte helt försvarbart som VG utan ett sista fokuserat pass.

Vad är de största luckorna?

- Säkerhetsstrategin är för svag på databassidan. Det finns ingen faktisk `GRANT`/`REVOKE`-lösning eller tydlig least-privilege-modell för databasanvändaren.
- Prestandadelen är tekniskt påbörjad genom index och indexstädning, men saknar en tydlig, reproducerbar analys som är lätt att försvara muntligt.
- README uppfyller inte starkt nog PDF-kravet om att motivera databasstruktur och säkerhetsåtgärder. Den innehåller projektöversikt men inte en tydlig reflektion på den nivån.
- Integritetsdelen är i praktiken god, men explicit `CHECK` saknas i nuvarande schema. Det gör G/VG-försvaret lite svagare än det behöver vara.
- Repot innehåller ett konkret säkerhetsproblem: `docs/VERIFICATION_REPORT.md` visar ett faktiskt databaslösenord i klartext.

Är databasen överbyggd, underbyggd eller i sweet spot?

- Själva databasschemat ligger nära sweet spot för kursnivån: litet, begripligt, relationsriktigt och försvarbart.
- Säkerhets- och VG-dokumentationsdelen är däremot underbyggd.
- Den enda lilla överbyggnaden är att vissa delar finns mer för kursvärde än för runtime, särskilt den lagrade proceduren som inte verkar vara central i appens vanliga flöde.

Vilka 3–5 saker ger högst VG-effekt per insats?

1. Inför en minimal databassäkerhetsstrategi med en begränsad databasanvändare och dokumenterade `GRANT`/`REVOKE`.
2. Lägg till en kort, reproducerbar prestandadel med 2–3 `EXPLAIN`-kontroller och motivering av nuvarande index.
3. Stärk README med en kort reflektion om databasval, struktur och säkerhetsåtgärder, och länka till denna analysfil.
4. Ta bort klartextlösenordet ur `docs/VERIFICATION_REPORT.md`.
5. Lägg till minst en enkel `CHECK`-constraint för att minska tolkningsrisken kring integritetskravet.

## 4. VG-kriterier punkt för punkt

### 4.1 Minst tre sammanlänkade tabeller
Kriterium:

- Databasen ska ha minst tre sammanlänkade tabeller.

Status:

- **UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` definierar sex tabeller: `Anvandare`, `Kategorier`, `Poster`, `Begrepp`, `PostBegrepp`, `AktivitetLogg`.
- Relationer finns mellan `Poster` och `Anvandare`, `Poster` och `Kategorier`, `PostBegrepp` och både `Poster`/`Begrepp`, samt `AktivitetLogg` och `Poster`/`Anvandare`.
- `backend/tests/test_database_truth.py` verifierar att de sex kärntabellerna finns.

Bedömning:

- Kravet är tydligt uppfyllt med god marginal.

Åtgärd:

- Ingen åtgärd krävs.

### 4.2 Implementera tabellerna i ett RDBMS
Kriterium:

- Tabellerna ska implementeras i ett relationsdatabassystem som MySQL eller PostgreSQL.

Status:

- **UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` skapar databasen `reflektionsarkiv` i MySQL-syntax.
- `backend/app/db.py` använder `mysql-connector-python`.
- `README.md` anger MySQL som databasmotor.

Bedömning:

- Projektet är tydligt byggt kring MySQL som RDBMS.

Åtgärd:

- Ingen åtgärd krävs.

### 4.3 Primärnycklar och främmande nycklar
Kriterium:

- Primär- och främmande nycklar ska användas för att koppla ihop tabellerna korrekt.

Status:

- **UPPFYLLT**

Bevis:

- Alla tabeller i `reflektionsarkiv.sql` har primärnycklar via `AUTO_INCREMENT PRIMARY KEY`.
- `Poster`, `PostBegrepp` och `AktivitetLogg` använder främmande nycklar.
- `database/migrations/009_database_truth_consolidation.sql` och `backend/tests/test_database_truth.py` bekräftar att delete-reglerna på centrala FK:er är explicita.

Bedömning:

- Den relationella kopplingen är korrekt och tydlig. `PostBegrepp` löser många-till-många-relationen på rätt sätt.

Åtgärd:

- Ingen åtgärd krävs.

### 4.4 Dataintegritet med constraints
Kriterium:

- Dataintegritet ska säkerställas med constraints som `NOT NULL`, `CHECK`, `DEFAULT` och `FOREIGN KEY`.

Status:

- **DELVIS UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` använder `NOT NULL`, `DEFAULT`, `FOREIGN KEY`, `UNIQUE` och `ENUM`.
- `PostBegrepp` har `UNIQUE (PostID, BegreppID)`.
- `Poster.Synlighet` begränsas via `ENUM`.
- Ingen verifierbar `CHECK`-constraint hittades i `reflektionsarkiv.sql` eller övriga granskade filer.

Bedömning:

- Integriteten är i praktiken ganska stark redan nu.
- Det svaga ledet är att just `CHECK` saknas, trots att PDF-underlaget uttryckligen nämner det.
- `ENUM` ger delvis samma effekt på vissa fält, men det är inte samma sak som att kunna peka på en faktisk `CHECK`.

Åtgärd:

- Minsta rimliga åtgärd är att lägga till minst en enkel `CHECK`-constraint i kärnmodellen, till exempel att titel eller användarnamn inte får vara tom sträng efter trimning.
- Det behövs främst för att göra försvarslinjen tydligare, inte för att modellen i övrigt är svag.

### 4.5 Trigger
Kriterium:

- Minst en trigger ska automatisera en uppgift.

Status:

- **UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` definierar triggern `trigga_ny_post_logg`.
- Triggern lägger in en rad i `AktivitetLogg` efter `INSERT` i `Poster`.
- `backend/tests/test_database_truth.py` verifierar att triggern finns.

Bedömning:

- Kravet är uppfyllt.
- Triggern är enkel men tydlig och lätt att demonstrera.

Åtgärd:

- Ingen åtgärd krävs för att uppfylla kriteriet.
- För starkare redovisning är det bra att också demonstrera triggerns effekt i praktiken, inte bara att den existerar.

### 4.6 JOIN och GROUP BY i minst två SQL-frågor
Kriterium:

- Projektet ska använda `JOIN` och `GROUP BY` i minst två SQL-frågor för att hämta och analysera data.

Status:

- **UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` innehåller flera JOIN-frågor, bland annat mellan `PostBegrepp`, `Poster` och `Begrepp`, samt mellan `Poster` och `Kategorier`.
- `reflektionsarkiv.sql` innehåller flera `GROUP BY`-frågor, bland annat antal poster per användare och antal kopplingar per begrepp.
- Den lagrade proceduren `hamta_poster_per_kategori` använder också `GROUP BY`.

Bedömning:

- Kravet är tydligt uppfyllt.

Åtgärd:

- Ingen åtgärd krävs.

### 4.7 Motivera databasstruktur och säkerhetsåtgärder i README
Kriterium:

- README ska innehålla en skriftlig reflektion som motiverar databasstruktur och säkerhetsåtgärder.

Status:

- **DELVIS UPPFYLLT**

Bevis:

- `README.md` beskriver stack, startflöde, övergripande databasmodell och några driftaspekter.
- `README.md` säger att databasen är liten och att AI och matchning ligger främst i backend.
- Det finns däremot ingen stark, samlad reflektion i `README.md` om varför strukturen ser ut som den gör och hur säkerhetsstrategin är tänkt.
- Sådana resonemang finns delvis i `docs/DATABASE_HELP.md`, `docs/ARCHITECTURE.md` och nu i denna fil, men PDF-underlaget nämner uttryckligen `README.md`.

Bedömning:

- Strukturdelen är delvis dokumenterad.
- Säkerhetsdelen i README är för tunn för att vara ett starkt VG-försvar.

Åtgärd:

- Lägg in en kort, tydlig README-sektion om databasens designval, integritet och säkerhetsåtgärder, samt länka till `docs/VG_ANALYS_OCH_ATERSTAENDE.md`.

### 4.8 Välja mellan SQL, NoSQL eller hybrid och motivera valet
Kriterium:

- På VG-nivå ska valet av SQL, NoSQL eller hybridlösning motiveras.

Status:

- **DELVIS UPPFYLLT**

Bevis:

- Projektet använder tydligt MySQL enligt `README.md`, `backend/app/db.py` och `backend/.env.example`.
- Datamodellen i `reflektionsarkiv.sql` är tydligt relationell och bygger på FK, JOINs, M:N-tabell och constraints.
- Någon tydlig jämförelse mot NoSQL, hybrid eller andra relationsmotorer finns inte idag i granskade projektfiler.

Bedömning:

- Det finns ett implicit tekniskt argument för SQL eftersom modellen faktiskt är relationell.
- Det finns däremot inte en tillräckligt explicit motivering i dagens material.

Åtgärd:

- Lägg till en kort, saklig jämförelse mellan relationsdatabas, NoSQL och eventuellt PostgreSQL. Denna fil innehåller ett sådant avsnitt i sektion 11, men det bör också kunna sammanfattas muntligt och kort i README.

### 4.9 Lagrad procedur
Kriterium:

- En lagrad procedur ska implementeras för att automatisera en uppgift.

Status:

- **UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` definierar `hamta_poster_per_kategori`.
- `backend/tests/test_database_truth.py` verifierar att proceduren finns.

Bedömning:

- Kravet är uppfyllt.
- Proceduren är enkel men relevant för rapportering och analys.

Åtgärd:

- Ingen åtgärd krävs för att nå kriteriet.
- För bättre försvar bör proceduren demonstreras med ett konkret `CALL` och förklaras som databasnära analyslogik.

### 4.10 Säkerhetsstrategi
Kriterium:

- En säkerhetsstrategi ska implementeras, till exempel med `GRANT` och `REVOKE` om det finns användare.

Status:

- **DELVIS UPPFYLLT**

Bevis:

- `.gitignore` skyddar `.env` och flera typer av nycklar och credentials från att checkas in.
- `backend/.env.example` separerar konfiguration från kod.
- `backend/app/repositories/*.py` använder i huvudsak parameteriserade SQL-frågor med `%s`.
- `backend/app/db.py` använder ett enda databaskonto från miljövariabler, standardmässigt `DB_USER=root`.
- Ingen `GRANT` eller `REVOKE` hittades i repot.
- Ingen verifierbar least-privilege-modell hittades för databasanvändaren.
- `docs/VERIFICATION_REPORT.md` innehåller ett verkligt databasenlösenord i klartext, vilket direkt försvagar säkerhetsbilden.

Bedömning:

- Det finns vissa säkerhetsåtgärder, men de räcker inte som stark VG-säkerhetsstrategi.
- Det största problemet är att databasen verkar nås med ett generellt konto i stället för ett begränsat applikationskonto.
- Det näst största problemet är att hemligheter hanterats inkonsekvent i dokumentation.

Åtgärd:

- Minsta rimliga åtgärd är att skapa en enkel, dokumenterad rättighetsmodell:
- en begränsad databasanvändare för appen
- eventuellt en separat adminanvändare för schemaändringar och demo
- ett kort SQL-skript med `CREATE USER`, `GRANT`, och vid behov `REVOKE`
- rensa verkliga lösenord ur dokumentationen

### 4.11 Prestandaanalys och optimeringsmöjligheter
Kriterium:

- Databasens prestanda ska analyseras och optimeringsmöjligheter ska redovisas, till exempel indexering.

Status:

- **DELVIS UPPFYLLT**

Bevis:

- `reflektionsarkiv.sql` innehåller explicita index för centrala accessmönster.
- `database/migrations/009_database_truth_consolidation.sql` tar bort redundanta index och gör indexstrategin mer stringent.
- `backend/tests/test_database_truth.py` verifierar vissa index och delete-regler.
- `backend/app/repositories/post_repo.py` och `backend/app/repositories/activity_repo.py` visar vilka frågemönster indexen svarar mot.
- Någon sammanhållen, reproducerbar prestandaanalys med dokumenterade `EXPLAIN`-resultat eller liknande hittades inte i repo-underlaget.

Bedömning:

- Projektet har tekniskt motiverad indexering.
- Det som saknas är ett tydligt bevispaket som examinatorn kan följa steg för steg.

Åtgärd:

- Kör och dokumentera några få men tydliga prestandakontroller, till exempel:
- listning av poster per användare
- publik listning av poster
- aktivitetslogg per post
- förklara vilka index som används, vilka som togs bort och varför

### 4.12 E-handelsspecifika VG-exempel i PDF:en
Kriterium:

- PDF:en ger ett VG-exempel med e-handel, lageruppdatering och adminrättigheter.

Status:

- **EJ RELEVANT / INTE NÖDVÄNDIGT**

Bevis:

- `VG/YH_26_planering_databaser (1).pdf` presenterar e-handel som ett projektförslag, inte som ett universellt krav för alla projekt.
- Nuvarande projekt är ett reflektions- och postarkiv, inte en e-handelslösning.

Bedömning:

- Det vore fel att importera domänkrav från e-handel rakt av.
- Det relevanta att ta med från VG-exemplet är den abstrakta nivån: trigger, stored procedure, säkerhetsstrategi och motiverade designval.

Åtgärd:

- Ingen åtgärd krävs.
- Försvaret ska tydligt säga att e-handeln är ett exempel på VG-nivå, inte ett krav på just denna domän.

## 5. Databasens nuvarande designval
Projektets databas är designad som en liten, tydlig relationsmodell där kärnan är:

- användare
- kategorier
- poster
- begrepp
- relationen mellan poster och begrepp
- en enkel aktivitetslogg

Varför tabellerna ser ut som de gör:

- `Anvandare` finns separat eftersom en användare kan skriva många poster.
- `Kategorier` ligger separat eftersom flera poster kan dela samma kategori, och kategorin är en stabil domänklassificering.
- `Poster` är kärntabellen eftersom det är där huvudinnehållet bor.
- `Begrepp` ligger separat eftersom samma symbolord ska kunna återanvändas över många poster.
- `PostBegrepp` behövs för att lösa många-till-många-relationen mellan poster och begrepp.
- `AktivitetLogg` ligger separat för att logghändelser inte ska blandas in i själva postdatan.

Varför relationerna ser ut som de gör:

- `Poster` till `Anvandare` är en klassisk en-till-många-relation.
- `Poster` till `Kategorier` är också en-till-många.
- `Poster` till `Begrepp` är många-till-många och kräver därför en bryggtabell.
- `AktivitetLogg` är knuten till både post och användare för att kunna beskriva vem logghändelsen gäller.

Varför primärnycklar, främmande nycklar, index och constraints ser ut som de gör:

- Surrogatnycklar med `AUTO_INCREMENT` förenklar CRUD, joins och backendkod.
- Främmande nycklar skyddar referensintegriteten mellan tabellerna.
- `UNIQUE` på e-post, kategorinamn och begreppsord hindrar dubbletter på naturligt unika värden.
- `UNIQUE` i `PostBegrepp` hindrar att samma begrepp kopplas dubbelt till samma post.
- Indexen ligger främst där appen filtrerar och joinar.
- `ON DELETE CASCADE` används där barnrader tydligt tillhör en post eller ett begrepp, men inte där borttagning av användare eller kategorier skulle kunna bli för aggressiv.

Varför vissa delar separerats i egna tabeller:

- Kategorier och begrepp separeras för återanvändning, ordning och bättre dataintegritet.
- Loggen separeras för att hålla postdatan ren.
- M:N-kopplingen separeras eftersom flera begrepp kan höra till samma post, och samma begrepp kan höra till flera poster.

Varför andra delar inte brutits ut ytterligare:

- `Begrepp.Beskrivning` innehåller idag ett helt tolkningsstycke i ett textfält i stället för att delas upp i fler tabeller för källor, skolbildningar eller synonymnät.
- Det är en medveten förenkling som håller modellen hanterbar på kursnivå.
- `AktivitetLogg` är avsiktligt enkel och inte uppdelad till full revisionsmodell eller generisk event sourcing.

Samlad bedömning:

- Designen prioriterar tydlighet, dataintegritet, underhållbarhet och rimlig komplexitet.
- För kursnivån är detta i grunden ett bra val.
- Det mesta som skulle brytas ut ytterligare skulle ge mer komplexitet än pedagogiskt värde i nuvarande scope.

## 6. Normalisering
Praktisk normaliseringsnivå:

- Kärnmodellen ligger ungefär på en rimlig 3NF-nivå för projektets huvuddata.

Det som är väl normaliserat:

- användare ligger separat från poster
- kategorier ligger separat från poster
- begrepp ligger separat från poster
- många-till-många mellan poster och begrepp löses korrekt via `PostBegrepp`

Det som innehåller redundans eller medvetna kompromisser:

- `Begrepp.Beskrivning` är medvetet denormaliserad eftersom hela tolkningspaketet ligger i ett textfält.
- Det gör modellen enkel att arbeta med men sämre för strukturerad källspårning, finare analys och vidareutbyggnad.
- `PostBegrepp` använder både eget ID och en sammansatt unikhetsregel. Det är inte fel, men mer än absolut minimum.

Det som eventuellt skulle kunna normaliseras mer:

- Om projektet skulle växa kraftigt skulle begreppsbeskrivningar kunna delas upp i fler tabeller för källor, tolkningsskola, synonymik eller versionering.
- Om aktivitetsloggen skulle bli viktig på riktigt skulle den kunna modelleras som en tydligare revisions- eller händelsetabell.

Det som redan är tillräckligt normaliserat för projektets nivå:

- den relationella kärnmodellen
- många-till-många-strukturen
- uppdelningen mellan användare, poster, kategorier och begrepp

Bedömning:

- Databasen är inte överdenormaliserad i kärnan.
- Den är inte heller övernormaliserad.
- Den viktigaste kompromissen är `Begrepp`, och den kompromissen är försvarbar så länge man är ärlig med att den är vald för enkelhet och kursnivå, inte för maximal modellrenhet.

## 7. Säkerhet och dataskydd
Nuvarande säkerhetsläge:

- Det finns visst skydd för hemligheter genom `.gitignore` och `backend/.env.example`.
- `OPENAI_API_KEY` hålls på serversidan enligt README och backendkonfiguration.
- Dataintegritet skyddas delvis av constraints i databasen.
- SQL-frågor i repositories använder i huvudsak parameterisering.

Det som redan finns och är bra:

- `NOT NULL`, `UNIQUE`, `FOREIGN KEY` och `ENUM` skyddar mot ogiltig data.
- `.env` ligger utanför versionshantering enligt `.gitignore`.
- Backend använder parametriserade frågor i centrala repositories.

Det som är svagt eller saknas:

- least privilege saknas i praktiken, eftersom backend verkar använda ett generellt databaskonto
- ingen verifierbar `GRANT`/`REVOKE`-modell finns i repot
- app-användare och databasanvändare blandas lätt ihop om man inte förklarar skillnaden
- appens "inloggning" är inte verklig autentisering, utan ett lokalt valt användarobjekt i `localStorage`
- åtkomstkontroll i backend är svag, eftersom vissa API-anrop litar på klientens `anvandar_id` eller `viewer_user_id`
- `docs/VERIFICATION_REPORT.md` exponerar ett verkligt databasenlösenord i klartext
- appanvändare har ingen lösenordshantering alls, alltså varken hashning eller riktig verifiering

Viktig förklaring: app-användare och databasanvändare är inte samma sak

- App-användare är poster i tabellen `Anvandare`.
- Databasanvändaren är MySQL-kontot som backend använder via `DB_USER` och `DB_PASSWORD`.
- Databasen ser alltså inte vilken appanvändare som gör något. Den ser bara backendens databasanslutning.
- Det betyder att nuvarande lösning inte har databassäker användarseparation eller radnivåskontroll.

Vad som rimligen bör finnas för VG på denna nivå:

- ett begränsat databaskonto för applikationen
- dokumenterade `GRANT`-rättigheter för det kontot
- eventuellt ett separat adminkonto för schemaändringar och drift
- sanering av hemligheter i dokumentation
- tydlig muntlig förklaring att appens lokala användarval inte är samma sak som databassäker autentisering

Vad som inte behöver byggas ut för mycket:

- fullständig enterprise-autentisering
- avancerad rollmatris med många roller
- extern IAM-lösning
- komplex kryptografisk identitetsarkitektur

Backup/restore som driftsäkerhetsfråga:

- `reflektionsarkiv.sql` förbereder en `reflektionsarkiv_restoretest`-databas, men någon verklig dump/restore-runbook finns inte.
- Backup/restore är inte det tydligaste VG-kravet i PDF:en, men det är ett starkt demonstrationsinslag om tid finns.

## 8. Funktionalitet som ska demonstreras vid redovisning
Praktisk checklista:

- [ ] Visa att databasen kan skapas från scratch med `reflektionsarkiv.sql`
- [ ] Visa att migreringarna går att köra efter grundimport
- [ ] Visa att de sex tabellerna finns
- [ ] Visa primärnycklar och främmande nycklar i modellen
- [ ] Visa att `PostBegrepp` löser många-till-många-relationen
- [ ] Visa att `UNIQUE` hindrar dubbletter på lämpliga fält
- [ ] Visa minst en triggerkörning: skapa en post och kontrollera att `AktivitetLogg` får en rad
- [ ] Visa den lagrade proceduren med ett konkret `CALL`
- [ ] Visa minst två SQL-frågor med `JOIN`
- [ ] Visa minst två SQL-frågor med `GROUP BY`
- [ ] Visa att `ON DELETE CASCADE` fungerar för postrelaterade barnrader
- [ ] Visa varför nuvarande index finns
- [ ] Visa minst ett exempel på prestandaresonemang, helst med `EXPLAIN`
- [ ] Förklara varför relationsdatabas passar bättre än NoSQL för just denna modell
- [ ] Förklara skillnaden mellan app-användare och databasanvändare
- [ ] Om rättighetsspår införs: visa `GRANT`/`REVOKE` eller åtminstone ett begränsat appkonto
- [ ] Om tid finns: visa enkel backup/restore till restoretest-databasen

## 9. Vad som återstår att verkställa
### 1. Måste göras

#### A. Inför en minimal databassäkerhetsstrategi
Kvar att göra:

- skapa ett begränsat databaskonto för applikationen och dokumentera rättigheterna

Varför det behövs:

- detta är den största VG-luckan och den svagaste delen i nuvarande försvar

Exakt minsta åtgärd:

- skapa ett SQL-skript som gör ungefär detta:
- `CREATE USER` för ett appkonto
- `GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE` på `reflektionsarkiv.*`
- använd kontot i `backend/.env`
- dokumentera kort vad adminkontot används till och vad appkontot används till

Förväntad VG-effekt:

- mycket hög

Risk om vi hoppar över det:

- VG-försvaret på säkerhet blir märkbart svagare

#### B. Dokumentera prestanda tydligare
Kvar att göra:

- skapa en liten, konkret prestandadel som går att reproducera och förklara

Varför det behövs:

- index finns, men analysbeviset är för tunt idag

Exakt minsta åtgärd:

- välj 2–3 nyckelqueries
- kör `EXPLAIN`
- skriv kort varför respektive index finns eller saknas

Förväntad VG-effekt:

- hög

Risk om vi hoppar över det:

- examinatorn kan uppleva att optimeringsdelen mest är påstådd, inte visad

#### C. Sanera hemligheter i dokumentation
Kvar att göra:

- ta bort verkligt databasenlösenord ur `docs/VERIFICATION_REPORT.md`

Varför det behövs:

- nuvarande fil underminerar direkt säkerhetsargumentet

Exakt minsta åtgärd:

- ersätt lösenordet med en neutral placeholder

Förväntad VG-effekt:

- hög i trovärdighet, liten i arbetsinsats

Risk om vi hoppar över det:

- säkerhetsförsvaret ser inkonsekvent och slarvigt ut

### 2. Bör göras

#### D. Stärk README som faktisk reflektionsfil
Kvar att göra:

- lägg till en kort README-sektion om databasstruktur, säkerhet och databasval

Varför det behövs:

- PDF-underlaget nämner uttryckligen README

Exakt minsta åtgärd:

- 8–15 rader som sammanfattar designval, integritet, säkerhetsåtgärder och länkar hit

Förväntad VG-effekt:

- medelhög

Risk om vi hoppar över det:

- läraren kan anse att just README-kravet inte är helt uppfyllt

#### E. Lägg till minst en enkel CHECK-constraint
Kvar att göra:

- lägg till en liten, tydlig `CHECK`

Varför det behövs:

- det minskar tolkningsrisken kring integritetskriteriet

Exakt minsta åtgärd:

- lägg till en eller två enkla checks på centrala textfält

Förväntad VG-effekt:

- medelhög

Risk om vi hoppar över det:

- kravet kan fortfarande gå att försvara, men mindre rent

### 3. Bra att ha men ej nödvändigt

#### F. Lägg till enkel backup/restore-runbook
Kvar att göra:

- dokumentera dump och återläsning till restoretest-databasen

Varför det behövs:

- det stärker demonstrationsvärdet

Exakt minsta åtgärd:

- visa `mysqldump` och återläsning i några få steg

Förväntad VG-effekt:

- låg till medelhög

Risk om vi hoppar över det:

- liten, eftersom detta inte framstår som kärnkrav i PDF:en

#### G. Demonstrera trigger och procedur med riktiga teststeg
Kvar att göra:

- skapa ett extra kort demoavsnitt eller teststeg för trigger/procedur

Varför det behövs:

- idag verifieras de tydligt i struktur, men mindre tydligt i faktisk körning

Exakt minsta åtgärd:

- lägg till två demo-kommandon eller skärmsäkra teststeg

Förväntad VG-effekt:

- låg till medelhög

Risk om vi hoppar över det:

- liten, men demot blir mindre vasst

## 10. Sådant som inte bör läggas till
Det här bör inte läggas till om målet är hög sanningshalt och minsta effektiva VG-pass:

- mikroservicespår
- NoSQL-spår utan tydligt projektbehov
- avancerad rollhantering med många roller
- full produktionsauth med tokens, sessionsserver och komplett användarkontoarkitektur
- överdrivet många tabeller för att bryta ut varje tolkningstext i `Begrepp`
- generell auditplattform eller event sourcing
- tung ORM-migrering bara för att se mer avancerad ut

Varför det inte behövs:

- kursuppgiften bedömer inte enterprise-arkitektur i sig
- nuvarande schema är redan tillräckligt rikt för att visa relationsmodellering, integritet, trigger, procedur och analys
- mer komplexitet riskerar att göra försvaret sämre, inte bättre

## 11. Teknikval: varför MySQL
Varför relationsmodell passar här:

- datan består av tydliga entiteter och relationer
- det finns naturliga främmande nycklar
- många-till-många mellan poster och begrepp är central
- projektet behöver JOINs, aggregationer, constraints, trigger och procedur

Varför NoSQL generellt inte är lika lämpligt här:

- projektets styrka ligger i relationer och integritet
- ett dokumentbaserat upplägg skulle göra referensintegritet och återanvändning av begrepp mindre naturlig
- det skulle gå att bygga, men det hade krävt fler applikationsregler för att kompensera för sådant relationsdatabasen redan gör bra

Varför MongoDB inte är lika lämpligt här:

- MongoDB hade passat bättre om poster och deras metadata främst vore fristående dokument utan starka relationer
- här behöver vi däremot tydliga relationer mellan användare, poster, kategorier och begrepp
- många-till-många, constraints och SQL-analys är mer naturligt i relationsmodell

Varför PostgreSQL hade kunnat vara ett alternativ:

- PostgreSQL hade också passat bra för denna typ av relationsdata
- det hade varit ett rimligt alternativ för mer avancerade constraints, typer eller senare utbyggnad

Varför MySQL ändå är fullt rimligt här:

- MySQL är uttryckligen tillåtet i underlaget
- MySQL stödjer det projektet faktiskt använder: tabeller, relationer, constraints, trigger, lagrad procedur, index och transaktioner
- projektets komplexitet kräver inte tydligt något som gör MySQL till ett dåligt val
- i kurskontext är det därför ett rimligt och försvarbart val

Varför SQLite är mindre relevant här:

- SQLite är smidigt för enklare lokala projekt
- det är mindre lämpligt som demonstrationsmotor för databasanvändare, behörigheter och tydlig serverdrift i detta sammanhang

Slutsats:

- relationsdatabas är rätt modell
- MySQL är ett rimligt och försvarbart val
- PostgreSQL hade också fungerat
- NoSQL hade inte gett någon tydlig vinst för just denna datamodell

## 12. Muntligt försvar
Fråga:

- Varför denna tabellstruktur?

Kort svar:

- För att separera användare, kategorier, poster och begrepp så att relationerna blir tydliga och datan inte dupliceras i onödan. Många-till-många mellan poster och begrepp löses korrekt via `PostBegrepp`.

Fråga:

- Varför relationstabell här?

Kort svar:

- En post kan ha många begrepp och ett begrepp kan användas i många poster. Det kräver en bryggtabell om man vill hålla modellen relationellt korrekt.

Fråga:

- Hur har ni tänkt kring normalisering?

Kort svar:

- Kärnmodellen är normaliserad på en rimlig nivå, ungefär 3NF i praktiken. Den viktigaste medvetna kompromissen är att `Begrepp.Beskrivning` är ett samlat textfält för enkelhetens skull.

Fråga:

- Hur skyddar ni data?

Kort svar:

- Genom constraints, främmande nycklar, parameteriserade queries och separerad `.env`-konfiguration. Det som återstår för starkare VG-försvar är en tydligare databassäkerhetsmodell med begränsade rättigheter.

Fråga:

- Varför MySQL?

Kort svar:

- För att projektet är tydligt relationellt och behöver joins, constraints, trigger, procedur och aggregationer. MySQL är tillåtet i kursen och räcker väl för detta scope.

Fråga:

- Hur visar ni behörighetsstyrning?

Kort svar:

- Just nu är det den svagaste delen. Minsta rimliga förbättring är att visa ett separat appkonto i databasen med begränsade `GRANT`-rättigheter och hålla schemaändringar till ett adminkonto.

Fråga:

- Vad hade ni gjort annorlunda i en större produktsättning?

Kort svar:

- Tydligare autentisering, bättre serververifierad åtkomstkontroll, striktare hemlighetshantering, mer dokumenterad prestandaövervakning och eventuellt mer uppdelad modell för begrepp och källor.

## 13. Slutlig rekommendation
Räcker nuvarande lösning för VG eller inte?

- Inte helt försvarbart ännu, men den är nära.

Exakt minsta återstående VG-pass:

1. inför en enkel men verklig databassäkerhetsstrategi med begränsat appkonto och `GRANT`/`REVOKE`
2. dokumentera prestanda med några få tydliga `EXPLAIN`-steg och indexmotiveringar
3. sanera verkliga hemligheter ur dokumentationen
4. stärk README med en kort reflektion om databasval, struktur och säkerhet
5. lägg till minst en enkel `CHECK`-constraint om ni vill göra integritetsdelen mindre tolkningsbar

Om detta görs:

- då bör projektet vara betydligt lättare att försvara som VG utan att bygga om databasen i onödan

Om ni inte hinner allt:

- prioritera säkerhetsstrategin först
- därefter prestandadokumentationen
- därefter README-förstärkningen

Slutbedömning:

- Databasen i sig är nära sweet spot.
- Det som återstår är främst inte att göra den större, utan att göra VG-bevisningen tätare, säkrare och lättare att försvara.
