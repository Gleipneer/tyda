# Tyda – Databasprojekt i kursen Databaser

## Författare

- Joakim Emilsson – YH25
- Martin Fält – YH25

## Kort projektbeskrivning

Tyda, med databasen `reflektionsarkiv`, är ett projekt där användare kan skapa poster om till exempel drömmar, tankar och reflektioner. Varje post tillhör en kategori, och begrepp kan kopplas till poster via en kopplingstabell. Det gör att databasen lagrar både innehåll och relationer mellan användare, poster, kategorier och symboliska begrepp.

Webbapplikationen är byggd ovanpå databasen, men databasen är kärnan i projektet. Det är där relationerna, reglerna, indexen, triggrarna och den lagrade proceduren finns.

## Syfte

Syftet med projektet är att bygga en liten men tydlig relationsdatabas som visar centrala delar av kursen Databaser i ett sammanhängande system. Vi ville visa att vi kan modellera data, skapa relationer, skydda dataintegritet, arbeta med SQL-frågor, använda triggers och stored procedure samt motivera våra designval.

## Varför relationsdatabas / varför MySQL

Vi valde en relationsdatabas eftersom datan är tydligt strukturerad och innehåller riktiga relationer:

- en användare kan skriva många poster
- en kategori kan användas av många poster
- en post kan ha många begrepp
- ett begrepp kan finnas i många poster

Det här passar bra i en relationsmodell med primärnycklar, främmande nycklar och JOIN. MySQL blev ett naturligt val eftersom det ger stöd för:

- tydlig tabellstruktur
- referensintegritet med FOREIGN KEY
- normalisering
- analysfrågor med SELECT, WHERE, JOIN, GROUP BY och HAVING
- trigger och lagrad procedur
- index för bättre prestanda

Vi valde alltså inte NoSQL eftersom projektet inte bygger på löst strukturerade dokument, utan på tydliga relationer som passar bättre i SQL.

## Databasens tabeller

### Anvandare

`Anvandare` lagrar användarna i systemet. Här finns användarnamn, e-post, lösenordshash, adminflagga och skapadatum. Tabellen används både för vanliga användare och för adminanvändare.

### Kategorier

`Kategorier` innehåller de typer av poster som finns i systemet, till exempel `drom`, `vision`, `tanke`, `reflektion` och `dikt`. Vi la kategorier i en egen tabell för att samma kategori ska kunna återanvändas av många poster utan duplicerad text.

### Poster

`Poster` är kärntabellen. Här lagras själva innehållet: titel, text, synlighet, datum och koppling till både användare och kategori.

### Begrepp

`Begrepp` fungerar som ett symbol- eller begreppslexikon. Här lagras ord som kan kopplas till poster, till exempel `orm`, `vatten`, `tempel` och `eld`, tillsammans med beskrivningar.

### PostBegrepp

`PostBegrepp` är kopplingstabellen mellan `Poster` och `Begrepp`. Den behövs eftersom relationen är många-till-många: en post kan ha flera begrepp, och samma begrepp kan förekomma i flera poster.

### AktivitetLogg

`AktivitetLogg` är en enkel loggtabell som fylls på av databasen när poster skapas eller uppdateras. Den visar att databasen inte bara lagrar data utan också kan reagera på händelser.

## Relationer

De centrala relationerna är:

- en användare kan ha många poster
- en kategori kan användas av många poster
- en post kan ha många begrepp
- ett begrepp kan finnas i många poster
- `PostBegrepp` är kopplingstabell för många-till-många-relationen mellan poster och begrepp

Det gör att databasen innehåller både en-till-många och många-till-många, vilket var viktigt för att projektet skulle bli tillräckligt rikt för kursen.

## Normalisering / designval

Vi valde att dela upp modellen i flera tabeller för att undvika duplicering och göra databasen tydligare.

Exempel:

- användardata lagras bara i `Anvandare`
- kategorier lagras bara i `Kategorier`
- begrepp lagras bara i `Begrepp`
- relationen mellan poster och begrepp ligger i `PostBegrepp`

På så sätt slipper vi skriva samma kategori- eller begreppsnamn om och om igen i `Poster`. Det gör databasen lättare att underhålla och enklare att fråga mot.

## Constraints och dataintegritet

Projektet använder flera vanliga skydd för datakvalitet:

- **PRIMARY KEY** på alla tabeller för unika rader
- **FOREIGN KEY** mellan relaterade tabeller för att skydda relationerna
- **NOT NULL** på fält som måste ha värde
- **UNIQUE** på till exempel `Anvandare.Epost`, `Kategorier.Namn`, `Begrepp.Ord` och kombinationen `(PostID, BegreppID)` i `PostBegrepp`
- **CHECK** på `Poster.Titel` så att titeln inte får vara tom
- **ENUM** på `Poster.Synlighet` med värdena `privat` och `publik`

De här reglerna skyddar databasen mot ogiltiga eller motsägelsefulla värden.

## Trigger

Projektet innehåller två triggers:

- `trigga_ny_post_logg`
- `trigga_post_uppdaterad_logg`

`trigga_ny_post_logg` körs efter `INSERT` i `Poster` och skriver då en rad i `AktivitetLogg` med händelsen `Ny post skapad`.

`trigga_post_uppdaterad_logg` körs efter `UPDATE` i `Poster` och loggar `Post uppdaterad` om titel, innehåll, synlighet eller kategori faktiskt har ändrats.

Det här visar att databasen kan automatisera loggning direkt i SQL-lagret.

## Stored procedure

Den lagrade proceduren heter `hamta_poster_per_kategori(IN p_fran_datum DATE, IN p_till_datum DATE)`.

Den räknar hur många poster som finns per kategori inom ett valt datumintervall. Vi valde den för att visa databasnära logik som går att återanvända och anropa som en färdig rapport.

## Index och prestanda

Följande index finns i databasen:

- `idx_poster_anvandare` på `Poster(AnvandarID)`
- `idx_poster_kategori` på `Poster(KategoriID)`
- `idx_poster_skapaddatum` på `Poster(SkapadDatum)`
- `idx_postbegrepp_begrepp` på `PostBegrepp(BegreppID)`
- `idx_aktivitetlogg_post_tidpunkt` på `AktivitetLogg(PostID, Tidpunkt)`

Vi la index där databasen ofta filtrerar, joinar eller sorterar. Det gör läsning och analys snabbare, särskilt för frågor som kopplar samman tabeller eller sorterar efter datum. Nackdelen är att `INSERT` och `UPDATE` blir lite tyngre eftersom index också måste uppdateras, men i vårt projekt är det en rimlig trade-off.

## Säkerhetsstrategi

Projektet använder en enkel men tydlig säkerhetsstrategi:

- **least privilege**
- separat app-användare i databasen
- `GRANT` och `REVOKE`
- appkontot ska inte göra schemaändringar
- lösenord lagras som hash i databasen

I `database/scripts/grants.sql` definieras databasrättigheterna. Tanken är att backend i drift ska använda `reflektionsarkiv_app`, som bara får:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `EXECUTE`

Det betyder att appkontot inte ska ha DDL-rättigheter som `CREATE`, `DROP` eller `ALTER`. Sådana ändringar ska i stället göras av ett privilegierat konto, till exempel `root` eller `reflektionsarkiv_admin`.

På applikationsnivå används också JWT och adminkontroll (`ArAdmin`) för att skydda adminfunktioner, men själva MySQL-rättigheterna styrs i databasen via `grants.sql`.

Lösenord lagras inte i klartext utan som bcrypt-hash i `Anvandare.LosenordHash`.

## Exempel på SQL-funktionalitet som projektet visar

Projektet visar bland annat:

- `SELECT`
- `WHERE`
- `ORDER BY`
- `INNER JOIN`
- `LEFT JOIN`
- `GROUP BY`
- `HAVING`
- transaktioner
- `ROLLBACK`
- trigger
- stored procedure

Transaktion och `ROLLBACK` visas i `reflektionsarkiv.sql` som exempel på hur ändringar kan testas och sedan ångras.

## Backup/restore

Projektet innehåller dokumentation och skript för backup:

- `docs/BACKUP.md`
- `database/scripts/backup.ps1`

Backupen bygger på `mysqldump` med `--single-transaction`, `--routines` och `--triggers`. Det gör att både procedurer och triggers kommer med i backupen. Återställning beskrivs också i `docs/BACKUP.md`.

## Hur man startar projektet

### Rekommenderat

Från projektroten:

```powershell
.\scripts\start.ps1
```

På Mac/Linux:

```bash
./scripts/start.sh
```

Startskripten installerar beroenden, skapar `.env` vid behov, försöker skapa databasen från `reflektionsarkiv.sql`, kör migrationer och startar backend och frontend.

### Manuell start

1. Skapa databasen:

```bash
mysql -u root -p < reflektionsarkiv.sql
```

2. Kör migrationer:

```powershell
cd backend
.\venv\Scripts\python.exe scripts\run_migration_utf8.py
```

3. Starta backend:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

4. Starta frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend kör normalt på `http://localhost:5173` och backend på `http://127.0.0.1:8000`.

## Adminportal / Databasfrågor

Adminportalen innehåller en egen vy för `Databasfrågor`. Där finns en whitelistad lista med fördefinierade SQL-frågor som körs via backend. Admin skriver inte egen SQL, utan väljer en fråga i listan och får se:

- titel
- kort beskrivning
- SQL-koden som faktiskt körs
- resultat i tabellform

Backenden skyddar routen med JWT och adminkontroll, och frågorna är skrivskyddade. Det gör vyn användbar både för demonstration och för att visa centrala SQL-delar mot den faktiska databasen.

## Reflektion och slutsats

Vi tycker att databasen passar uppgiften bra eftersom den är tillräckligt liten för att gå att förklara tydligt, men ändå tillräckligt rik för att visa många viktiga delar av relationsdatabaser.

Styrkor i projektet är:

- tydlig tabellstruktur
- riktiga relationer
- många-till-många via kopplingstabell
- dataintegritet med constraints
- triggers och stored procedure
- index och säkerhetsstrategi
- en adminvy som visar faktiska SQL-frågor mot databasen

Om projektet skulle byggas ut vidare hade vi kunnat lägga till fler rapporter, fler procedurer och fler administrativa databasvyer. Samtidigt har vi medvetet hållit själva databaskärnan tydlig och fokuserad, så att den går att förstå, försvara och demonstrera i kursen Databaser.
