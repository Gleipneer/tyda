# CURSOR_MASTER_PLAN.md
## Reflektionsarkiv – full väg från 0 till fungerande frontend + Python-backend ovanpå databasen

Författare: ChatGPT  
Projektägare: Joakim Emilsson  
Syfte: ge Cursor en komplett, tydlig och sanningsbunden arbetsplan för att bygga ett enkelt men starkt system ovanpå databasen `reflektionsarkiv`

**UPPDATERING (2025):** Databasmodellen är nu 6 tabeller. Tabellen `Kommentarer` har borttagits. Se `docs/DATABASE_HELP.md` för aktuell databasdokumentation.

---

# 1. VIKTIGT FÖRST

Det här dokumentet utgår från att databasen redan finns skapad och att SQL-filen har gått igenom.

Det här dokumentet beskriver:

- hur Cursor ska tänka
- hur Cursor ska arbeta
- hur backend ska se ut
- vilka API-endpoints som behövs
- hur frontend ska se ut
- hur alla delar kopplas ihop
- i vilken ordning allt ska byggas
- vad som är kärna och vad som är bonus
- hur systemet testas och valideras

## Sanningsbunden avgränsning
Detta är **inte** en färdig körd implementation.  
Detta är en **arkitektoniskt validerad plan** baserad på den datamodell vi redan låst.

Det betyder:

- databasdelen är konkret
- API-designen är härledd från databasen
- frontendförslaget är rimligt och kopplat till verkliga dataflöden
- men exakt runtime-validering i din miljö måste göras i Cursor när han bygger

Alltså:
- **designmässigt validerat**
- **inte exekveringsbevisat ännu**

---

# 2. MÅL

Bygg ett litet men komplett system ovanpå databasen `reflektionsarkiv` där användare kan:

- se alla poster
- skapa nya poster
- läsa en enskild post
- se begrepp kopplade till en post
- koppla begrepp till poster
- se kategorier
- se aktivitetslogg
- köra någon enkel analysvy
- på sikt markera ord i text som finns i begreppsbiblioteket

## Viktigt
Frontend och backend ska byggas för att **visa databasen tydligt**, inte för att gömma den bakom för mycket magi.

Det här är ett databasprojekt med ett presentationslager ovanpå.

---

# 3. TEAM UNDER HUVEN – HUR CURSOR SKA ARBETA

Cursor ska arbeta som ett internt specialistteam med följande roller:

## 3.1 Systemarkitekt
Ansvar:
- total struktur
- rätt lagerindelning
- rätt koppling mellan frontend, backend och databas
- låg komplexitet
- inga onödiga beroenden

## 3.2 Databasarkitekt
Ansvar:
- säkerställa att alla endpoints mappar korrekt till befintliga tabeller
- FK/PK respekteras
- queries är logiska
- inga felaktiga antaganden om schema

## 3.3 Python-backendutvecklare
Ansvar:
- bygga API ovanpå MySQL
- hantera queries, inserts, updates och joins
- skriva enkel, begriplig kod
- inga dolda smarta lager
- tydliga response-format

## 3.4 Frontendutvecklare
Ansvar:
- bygga en enkel, lugn, modern UI
- formulär för att skapa poster
- listvy för poster
- detaljvy för en post
- begreppssektion
- visualisering som känns meningsfull, inte överdesignad

## 3.5 UX/Produktdesigner
Ansvar:
- hålla projektet i rätt skala
- göra det tydligt för användaren vad som är:
  - post
  - kategori
  - begrepp
  - relationstyp (PostBegrepp)
- undvika att systemet låtsas vara “AI-tolkare”

## 3.6 QA/Testare
Ansvar:
- testa att varje endpoint fungerar
- testa att frontend visar rätt data
- testa felhantering
- testa tomma lägen
- testa relationer

## 3.7 Dokumentationsansvarig
Ansvar:
- hålla README uppdaterad
- dokumentera endpoints
- dokumentera startinstruktioner
- dokumentera vad som är klart och vad som är bonus

---

# 4. ARBETSPRINCIPER FÖR CURSOR

Cursor ska följa detta strikt:

## 4.1 Bygg i små steg
Inte allt samtidigt.

## 4.2 Verifiera varje steg innan nästa
Exempel:
- först databasanslutning
- sedan en enkel GET endpoint
- sedan frontend som läser den endpointen
- sedan nästa endpoint

## 4.3 Ingen dold logik
Allt viktigt ska vara lätt att förklara.

## 4.4 Databasen är sanningskällan
Frontend och Python är bara lager ovanpå.

## 4.5 Inget AI-lager i kärnan
Ingen LLM behövs för MVP.

## 4.6 Kommentarer i kod
Kod ska skrivas så pedagogiskt att Joakim kan läsa och förstå.

---

# 5. REKOMMENDERAD TEKNISK STACK

Detta är min rekommenderade minsta stack.

## Backend
- Python 3.12+
- FastAPI
- mysql-connector-python eller PyMySQL
- Pydantic för request/response-modeller
- Uvicorn som dev-server

## Frontend
Välj ett av två spår:

### Spår A – enklast och bäst för 2 veckor
- enkel HTML/CSS/JS
- eventuellt Jinja-templates via FastAPI/Starlette
- fetch-anrop till backend

### Spår B – renare modern frontend
- React + Vite
- enkel CSS eller Tailwind
- fetch eller axios mot backend

## Min rekommendation
För tid, förståelse och skolprojekt:
**FastAPI + enkel React/Vite** är en bra balans.

Om du vill minimera komplexitet maximalt:
**FastAPI + server-rendered templates**.

---

# 6. ÖVERGRIPANDE ARKITEKTUR

```text
[Frontend]
    |
    | HTTP / JSON
    v
[FastAPI Backend]
    |
    | SQL queries
    v
[MySQL: reflektionsarkiv]
Frontend ansvarar för:

formulär

vyer

visning

interaktion

Backend ansvarar för:

endpoints

validering

SQL-frågor

felhantering

format till frontend

Databasen ansvarar för:

lagring

relationer

integritet

trigger

stored procedure

7. DATAMODELL SOM BACKEND OCH FRONTEND MÅSTE FÖLJA

Databasen består av:

Anvandare

Kategorier

Poster

Begrepp

PostBegrepp

Kommentarer

AktivitetLogg

Viktiga relationer
Anvandare -> Poster

En användare kan ha många poster.

Kategorier -> Poster

En kategori kan användas av många poster.

Poster -> Kommentarer

En post kan ha många kommentarer.

Poster <-> Begrepp via PostBegrepp

En post kan ha många begrepp.
Ett begrepp kan höra till många poster.

Poster -> AktivitetLogg

När en post skapas loggas detta via trigger.

8. API-ENDPOINTS – ALLT SOM BEHÖVS

Nu kommer den viktigaste delen för Cursor.

Detta är de endpoints som behövs för att bygga en bra frontend ovanpå databasen.

8.1 HEALTH / BAS-ENDPOINTS
GET /api/health

Syfte:

kontrollera att backend är igång

Response:

{
  "status": "ok"
}
GET /api/db-health

Syfte:

kontrollera att backend kan prata med databasen

Response:

{
  "status": "ok",
  "database": "connected"
}
8.2 ANVÄNDARE
GET /api/users

Syfte:

hämta alla användare

SQL-idé:

SELECT * FROM Anvandare ORDER BY AnvandarID;
GET /api/users/{user_id}

Syfte:

hämta en användare

POST /api/users

Syfte:

skapa ny användare

Request body:

{
  "anvandarnamn": "Ny användare",
  "epost": "ny@example.com"
}
8.3 KATEGORIER
GET /api/categories

Syfte:

hämta alla kategorier

SQL-idé:

SELECT * FROM Kategorier ORDER BY Namn;
GET /api/categories/{category_id}

Syfte:

hämta en specifik kategori

8.4 POSTER
GET /api/posts

Syfte:

hämta alla poster i listvy

inkludera användarnamn och kategori direkt så frontend slipper göra extra anrop

Rekommenderad query:

SELECT
    Poster.PostID,
    Poster.Titel,
    Poster.Innehall,
    Poster.Synlighet,
    Poster.SkapadDatum,
    Anvandare.AnvandarID,
    Anvandare.Anvandarnamn,
    Kategorier.KategoriID,
    Kategorier.Namn AS Kategori
FROM Poster
INNER JOIN Anvandare ON Poster.AnvandarID = Anvandare.AnvandarID
INNER JOIN Kategorier ON Poster.KategoriID = Kategorier.KategoriID
ORDER BY Poster.SkapadDatum DESC;
GET /api/posts/{post_id}

Syfte:

hämta en enskild post med grunddata

POST /api/posts

Syfte:

skapa ny post

Request body:

{
  "anvandar_id": 1,
  "kategori_id": 1,
  "titel": "Dröm om vatten",
  "innehall": "Jag drömde om vatten och ett tempel.",
  "synlighet": "privat"
}

Viktigt:

denna endpoint kommer indirekt trigga databastriggern som skapar en loggrad

PUT /api/posts/{post_id}

Syfte:

uppdatera titel, innehåll eller synlighet

DELETE /api/posts/{post_id}

Syfte:

ta bort en post

Viktigt:

eftersom FK finns måste backend hantera beroenden först:

ta bort kommentarer

ta bort postbegrepp

ta bort loggrad(er)

sedan posten

alternativt använd transaktion

8.5 KOMMENTARER
GET /api/posts/{post_id}/comments

Syfte:

hämta alla kommentarer till en viss post

Rekommenderad query:

SELECT
    Kommentarer.KommentarID,
    Kommentarer.KommentarText,
    Kommentarer.SkapadDatum,
    Anvandare.Anvandarnamn
FROM Kommentarer
INNER JOIN Anvandare ON Kommentarer.AnvandarID = Anvandare.AnvandarID
WHERE Kommentarer.PostID = %s
ORDER BY Kommentarer.SkapadDatum ASC;
POST /api/posts/{post_id}/comments

Syfte:

skapa kommentar till en post

Request body:

{
  "anvandar_id": 2,
  "kommentar_text": "Det här känns som en stark symbol."
}
DELETE /api/comments/{comment_id}

Syfte:

ta bort en kommentar

8.6 BEGREPP
GET /api/concepts

Syfte:

hämta alla begrepp

GET /api/concepts/{concept_id}

Syfte:

hämta ett begrepp

POST /api/concepts

Syfte:

skapa nytt begrepp

Request body:

{
  "ord": "skugga",
  "beskrivning": "Kan kopplas till dolda sidor eller det omedvetna."
}
PUT /api/concepts/{concept_id}

Syfte:

uppdatera begrepp

DELETE /api/concepts/{concept_id}

Syfte:

ta bort begrepp

Viktigt:

först måste kopplingar i PostBegrepp bort

8.7 POST-BEGREPP-KOPPLINGAR
GET /api/posts/{post_id}/concepts

Syfte:

hämta alla begrepp som är kopplade till en post

Rekommenderad query:

SELECT
    PostBegrepp.PostBegreppID,
    Begrepp.BegreppID,
    Begrepp.Ord,
    Begrepp.Beskrivning,
FROM PostBegrepp
INNER JOIN Begrepp ON PostBegrepp.BegreppID = Begrepp.BegreppID
WHERE PostBegrepp.PostID = %s
ORDER BY Begrepp.Ord;
POST /api/posts/{post_id}/concepts

Syfte:

koppla ett begrepp till en post

Request body:

{
  "begrepp_id": 1,
}
DELETE /api/post-concepts/{post_begrepp_id}

Syfte:

ta bort en koppling mellan post och begrepp

8.8 AKTIVITETSLOGG
GET /api/activity

Syfte:

hämta aktivitetsloggen

GET /api/activity/post/{post_id}

Syfte:

hämta loggar för en viss post

8.9 ANALYS-ENDPOINTS

Dessa är viktiga för att visa databasens styrka.

GET /api/analytics/posts-per-category

Syfte:

returnera antal poster per kategori

Kan använda stored procedure eller vanlig query.

GET /api/analytics/posts-per-user

Syfte:

returnera antal poster per användare

GET /api/analytics/most-used-concepts

Syfte:

returnera mest använda begrepp

GET /api/analytics/posts-without-comments

Syfte:

returnera poster som saknar kommentarer

8.10 BONUS-ENDPOINT FÖR FRAMTIDA ORDMARKERING
POST /api/analyze/text-concepts

Syfte:

ta emot fri text

matcha ord mot Begrepp

returnera träffade ord

Request body:

{
  "text": "Jag drömde om en svart orm i ett tempel."
}

Exempelresponse:

{
  "matches": [
    {
      "ord": "orm",
      "begrepp_id": 1,
      "beskrivning": "Kan kopplas till instinkt, rädsla, förändring eller något dolt."
    },
    {
      "ord": "svart",
      "begrepp_id": 4,
      "beskrivning": "Kan kopplas till skugga, okändhet, natt eller djup."
    },
    {
      "ord": "tempel",
      "begrepp_id": 3,
      "beskrivning": "Kan symbolisera ett inre rum, sökande eller det heliga."
    }
  ]
}

Viktigt:

detta är inte AI

detta är enkel ordmatchning mot databasen

9. REKOMMENDERAD BACKEND-STRUKTUR I PYTHON
backend/
  app/
    main.py
    db.py
    config.py
    schemas/
      users.py
      categories.py
      posts.py
      comments.py
      concepts.py
      analytics.py
    routers/
      health.py
      users.py
      categories.py
      posts.py
      comments.py
      concepts.py
      activity.py
      analytics.py
      analyze.py
    services/
      post_service.py
      concept_service.py
      analytics_service.py
    repositories/
      user_repo.py
      category_repo.py
      post_repo.py
      comment_repo.py
      concept_repo.py
      activity_repo.py
      analytics_repo.py
Hur Cursor ska tänka här

routers/ = endpoints

repositories/ = ren SQL mot databasen

schemas/ = request/response-modeller

services/ = lätt affärslogik

db.py = anslutning till MySQL

Viktig princip:
håll SQL nära databasen
Inte göm SQL i massa abstraktion.

10. EXAKT HUR BACKEND SKA ARBETA
10.1 Databasanslutning

Backend ska ha en tydlig anslutningsfunktion med miljövariabler:

DB_HOST

DB_PORT

DB_NAME

DB_USER

DB_PASSWORD

10.2 Response-format

Alla endpoints ska returnera tydlig JSON.

10.3 Felhantering

Exempel:

404 om post inte finns

400 om ogiltig input

500 vid databasfel

10.4 Transaktioner

Använd transaktioner vid:

delete av post med beroenden

eventuella större flera-stegsoperationer

10.5 SQL ska kommenteras

Varje query ska förklaras i kod.

11. FRONTEND – HUR DEN SKA SE UT

Nu till frontenddelen.

Designmål

Frontend ska kännas:

lugn

tydlig

enkel

lätt att förstå

mer som ett reflektionsarkiv än ett socialt flöde

Inte:

överdrivet flashig

mystisk

“AI-spöklik”

plottrig

Storytel-klon i MVP

Ja till:

rena kort

tydliga formulär

vänlig läsbar typografi

diskreta färger

tydlig struktur

12. FRONTEND-SIDOR SOM BEHÖVS
12.1 Startsida / Dashboard

Ska visa:

antal poster

antal begrepp

antal kommentarer

senaste poster

enkel navigering

12.2 Poster-lista

Ska visa:

titel

användare

kategori

datum

synlighet

kort utdrag

Måste kunna:

öppna detaljvy

skapa ny post

12.3 Skapa post

Formulär med:

välj användare

välj kategori

titel

innehåll

synlighet

spara

Bonus:

enkel förhandsmatchning mot begrepp via /api/analyze/text-concepts

12.4 Post-detalj

Ska visa:

titel

innehåll

användare

kategori

datum

synlighet

kopplade begrepp

kommentarer

möjlighet att lägga till kommentar

möjlighet att koppla begrepp

12.5 Begreppsbibliotek

Ska visa:

alla begrepp

beskrivning

möjlighet att skapa nya

möjlighet att redigera

12.6 Analysvy

Ska visa:

poster per kategori

poster per användare

mest använda begrepp

poster utan kommentarer

12.7 Aktivitetslogg

Ska visa:

loggrader från triggern

datum

händelse

post-ID

användar-ID

13. FRONTEND-KOMPONENTER

Om React används bör följande komponenter finnas:

Layout

Sidebar

TopBar

StatsCards

PostList

PostCard

PostForm

PostDetail

CommentList

CommentForm

ConceptList

ConceptPicker

ActivityTable

AnalyticsPanel

14. FRONTEND-LOOK & FEEL
Färg och känsla

ljus bakgrund

mjuka neutrala färger

diskreta kontraster

fokus på läsbarhet

Typografi

systemfont eller ren sans serif

tydliga rubriker

bra radavstånd

Layout

vänsterspalt för navigation

huvudyta för innehåll

högerspalt kan vara bonus senare för begrepp eller analys

Mobil

inte fokus i första versionen

men layout ska inte vara totalt trasig på liten skärm

15. HUR FRONTENDEN SKA KOPPLA TILL BACKEND

Exempel på dataflöden:

När användaren går till poster-listan

Frontend anropar:

GET /api/posts

När användaren öppnar en post

Frontend anropar:

GET /api/posts/{post_id}

GET /api/posts/{post_id}/comments

GET /api/posts/{post_id}/concepts

När användaren skapar post

Frontend skickar:

POST /api/posts

När användaren lägger till kommentar

Frontend skickar:

POST /api/posts/{post_id}/comments

När användaren kopplar begrepp

Frontend skickar:

POST /api/posts/{post_id}/concepts

16. ROADMAP 0 -> 100 FÖR CURSOR

Nu kommer den praktiska byggordningen.

FAS 0 – FÖRBEREDELSE

Mål:

skapa projektstruktur

få backend att starta

få frontend att starta

koppla miljövariabler

Klart när:

backend svarar på /api/health

frontend startar lokalt

FAS 1 – DATABASANSUTNING

Mål:

backend kan koppla upp sig mot MySQL

/api/db-health fungerar

Klart när:

Cursor kan visa lyckad databasanslutning

FAS 2 – BAS-ENDPOINTS

Mål:

GET /api/users

GET /api/categories

GET /api/posts

Klart när:

frontend kan visa riktiga data från databasen

FAS 3 – POSTER FULLT FLÖDE

Mål:

skapa ny post

visa postdetalj

uppdatera post

ta bort post

Klart när:

hela CRUD för poster fungerar

FAS 4 – KOMMENTARER

Mål:

visa kommentarer

lägga till kommentar

ta bort kommentar

Klart när:

postdetaljsidan har fungerande kommentarssektion

FAS 5 – BEGREPP

Mål:

visa begreppsbibliotek

skapa begrepp

koppla begrepp till post

ta bort koppling

Klart när:

användaren kan bygga relationer mellan poster och begrepp

FAS 6 – AKTIVITETSLOGG

Mål:

visa att triggern fungerar i UI

endpoint för logg

Klart när:

nya poster ger logg som syns i frontend

FAS 7 – ANALYTICS

Mål:

poster per kategori

poster per användare

mest använda begrepp

poster utan kommentarer

Klart när:

analyssidan är funktionell

FAS 8 – BONUS: ORDMATCHNING

Mål:

enkel backend-funktion som matchar text mot begrepp

frontend kan visa träffade ord

Klart när:

användaren kan klistra in text och få träfflista

Viktigt:

detta är bonus, inte kärna

FAS 9 – POLISH

Mål:

snygga upp UI

bättre felmeddelanden

loading states

tomma states

bättre formulärvalidering

17. ACCEPTANCE CRITERIA – NÄR ÄR SYSTEMET GODKÄNT?

Systemet är i god form när:

backend startar utan fel

frontend startar utan fel

databasanslutning fungerar

alla bas-endpoints fungerar

poster kan skapas och visas

kommentarer fungerar

begrepp fungerar

triggern syns via logg

analysvyn visar riktig data

projektet går att demonstrera från ände till ände

18. VIKTIGA SQL-FLÖDEN SOM CURSOR MÅSTE RESPEKTERA
Skapa post

INSERT i Poster

trigger skapar logg automatiskt

Hämta postlista

JOIN mellan Poster, Anvandare, Kategorier

Hämta kommentarer

JOIN mellan Kommentarer och Anvandare

Hämta postbegrepp

JOIN mellan PostBegrepp och Begrepp

Analytics

GROUP BY

HAVING

LEFT JOIN där det behövs

19. FEL SOM CURSOR MÅSTE UNDVIKA

anta att databasen har fler tabeller än den faktiskt har

blanda ihop Begrepp med “AI-tolkning”

bygga frontend före att endpoints fungerar

dölja SQL bakom för mycket abstraktion

göra överdrivet avancerad auth

försöka bygga Storytel eller full social plattform nu

lägga in LLM eller AI-magik i kärnan

skapa endpoints som inte mappar tydligt till databasens verkliga schema

20. README SOM CURSOR SKA SKAPA

Cursor ska också skapa en kort README som innehåller:

vad projektet är

vilken stack som används

hur man startar backend

hur man startar frontend

vilka endpoints som finns

vilka tabeller databasen har

vad som är kärna

vad som är bonus/future work

21. EXAKT HUR CURSOR SKA ARBETA PRAKTISKT

Cursor ska arbeta i denna ordning:

läs detta dokument helt

skapa filstruktur

få backend att starta

få db-anslutning att fungera

bygg health endpoints

bygg users/categories/posts GET

koppla enkel frontend som visar posts

bygg create post

bygg comments

bygg concepts

bygg activity log

bygg analytics

bygg bonus-matchning om tid finns

polera UI

dokumentera allt

Efter varje steg ska Cursor:

köra projektet

testa endpoint

verifiera data i UI

skriva vad som fungerar och inte fungerar

22. SLUTLIG POSITIONERING

Det här systemet ska inte beskrivas som:

“AI som tolkar drömmar”

“mystisk sanningsmaskin”

“Storytel för visioner”

Det ska beskrivas som:

Ett reflektionsarkiv där användare kan skriva poster i olika kategorier, koppla dem till begrepp, kommentera dem och analysera återkommande teman.

Det är sant, tekniskt korrekt och mycket lättare att försvara.

23. SLUTLIGA INSTRUKTIONER TILL CURSOR

Bygg detta som ett lugnt, tydligt, pedagogiskt system där databasen är kärnan.
All kod ska vara kommenterad så att Joakim kan förstå exakt varför varje del finns.
All SQL-användning ska vara synlig och rimlig.
Inga onödiga lager.
Inga onödiga beroenden.
Inget scope-drift.

Fokusera på:

tydlig datavisning

tydlig CRUD

tydlig relationsvisning

tydlig analys

tydlig koppling till databasen

Det är så projektet blir både genomförbart och starkt.

Det viktigaste som återstår är detta:

1. En exakt API-spec

Inte bara vilka endpoints som finns, utan för varje endpoint:

metod

path

request body

response body

felkoder

exempeldata

Detta minskar risken att backend och frontend glider isär.

2. En konkret filträd-spec

Exakt vilka filer Cursor ska skapa först, till exempel:

backend/app/main.py

backend/app/db.py

backend/app/routers/posts.py

frontend/src/pages/PostsPage.tsx

osv

Nu har han struktur på hög nivå, men inte full “create these files first”.

3. Pydantic-/datamodeller

För backend behöver han exakta modeller för:

user create/read

category read

post create/update/read

comment create/read

concept create/update/read

analytics responses

Annars börjar han hitta på format.

4. SQL-queries färdigskrivna per endpoint

Detta är väldigt viktigt.
Alltså: för varje endpoint, skriv ut exakt vilken query han ska använda som startpunkt.

5. Val av frontendspår

Du bör låsa ett av dessa:

FastAPI + Jinja/templates

FastAPI + React/Vite

Min rekommendation:
FastAPI + React/Vite, om du vill att det ska kännas modernare.
FastAPI + templates, om du vill bli klar snabbast.

6. UI-wireframe i text

Inte designbilder, men exakt:

startsida visar detta

postlista visar detta

postdetalj visar detta

skapa-post-formulär har dessa fält

analyssida har dessa kort/tabeller

7. Körordning för Cursor

En ännu mer konkret checklista:

steg 1: bygg health

steg 2: bygg db-health

steg 3: bygg users/categories GET

steg 4: bygg posts GET

steg 5: bygg create post

osv

Så att han inte improviserar.

8. Acceptanstest / done-definition

För varje fas:

vad måste fungera

hur verifieras det

vad räknas som klart

Min bedömning

Du har redan arkitekturen.
Det som saknas nu är främst:

kontrakt

filnivå

exakta request/response-format

exakta queries

byggordning

Så svaret är:

Ja, lite mer behövs

Men inte mer vision.
Nu behövs implementation contracts.

Det jag tycker vi ska göra nu

Skapa dessa fyra .md-filer:

01_SYSTEM_OVERVIEW.md

02_API_CONTRACT.md

03_CURSOR_BUILD_ORDER.md

04_FRONTEND_SPEC.md

Det vore den bästa nästa skärpningen.

# 01_SYSTEM_OVERVIEW.md
## Reflektionsarkiv – systemöversikt från 0 till fungerande app

Författare: ChatGPT  
Projektägare: Joakim Emilsson  
Syfte: ge Cursor en komplett, tydlig och sanningsbunden översikt över hela systemet

---

# 1. VAD DETTA PROJEKT ÄR

Detta projekt är en liten webbapplikation ovanpå databasen `reflektionsarkiv`.

Systemet bygger på en relationsdatabas där användare kan:

- skapa poster
- välja kategori för posten
- läsa poster
- kommentera poster
- koppla begrepp till poster
- se aktivitetslogg
- se enkel analys/statistik

Det viktiga är:

- databasen är kärnan
- backend i Python är bara ett tydligt lager ovanpå databasen
- frontend är ett visningslager ovanpå backend

Systemet ska inte låtsas vara AI.
Systemet ska inte låtsas tolka användaren “på riktigt”.
Systemet ska visa hur data lagras, kopplas ihop och kan hämtas på ett snyggt och begripligt sätt.

---

# 2. KÄRNIDÉN

Användaren skriver självreflektiva poster, till exempel:

- dröm
- vision
- tanke
- reflektion
- dikt

Poster kan sedan:

- tillhöra en kategori
- få kommentarer
- kopplas till begrepp, till exempel:
  - orm
  - vatten
  - tempel
  - svart
  - eld
  - resa

Detta gör att systemet får tydliga relationer i databasen och en tydlig visning i frontend.

---

# 3. VIKTIG AVGRÄNSNING

Detta system bygger inte:

- AI-tolkning
- riktig semantisk analys
- stor communityplattform
- avancerad autentisering
- Storytel-klon
- mobilapp
- rekommendationsmotor

Detta system bygger:

- en fungerande frontend
- en fungerande Python-backend
- ett tydligt API
- ett tydligt lager ovanpå databasen
- en enkel men stark produktdemonstration

---

# 4. DATABASEN SOM ALLT BYGGER PÅ

Databasen har följande tabeller:

- `Anvandare`
- `Kategorier`
- `Poster`
- `Begrepp`
- `PostBegrepp`
- `AktivitetLogg`

---

# 5. HUR TABELLERNA HÄNGER IHOP

## Anvandare
Lagrar användarna.

Relationer:
- en användare kan skapa många poster

## Kategorier
Lagrar posttyper.

Exempel:
- dröm
- vision
- tanke
- reflektion
- dikt

Relationer:
- en kategori kan användas av många poster

## Poster
Kärntabellen.

Här lagras själva innehållet.

Relationer:
- varje post tillhör en användare
- varje post tillhör en kategori
- en post kan kopplas till många begrepp

## Begrepp
Lagrar ord eller symboler som systemet känner till.

Exempel:
- orm
- vatten
- tempel
- svart

Relationer:
- ett begrepp kan kopplas till många poster

## PostBegrepp
Kopplingstabell mellan poster och begrepp.

Varför den behövs:
- en post kan ha många begrepp
- ett begrepp kan höra till många poster

## AktivitetLogg
Lagrar automatiska loggrader.

Varför den behövs:
- triggern skriver hit när en ny post skapas

---

# 6. SYSTEMARKITEKTUR

```text
[Frontend]
   |
   | HTTP / JSON
   v
[FastAPI Backend]
   |
   | SQL
   v
[MySQL: reflektionsarkiv]

7. REKOMMENDERAD STACK
Backend

Python 3.12+

FastAPI

mysql-connector-python

Pydantic

Uvicorn

Frontend

React

Vite

enkel CSS eller Tailwind

Varför denna stack

Den är:

vanlig

lätt att bygga

lätt att förstå

lätt att demo-köra

passar bra för skolprojekt

8. SYSTEMETS TRE LAGER
Databaslager

Ansvarar för:

lagring

relationer

constraints

trigger

stored procedure

index

Backendlager

Ansvarar för:

API-endpoints

databasanslutning

SQL-frågor

validering

format på response

Frontendlager

Ansvarar för:

visning

formulär

interaktion

fetch-anrop till API

9. VAD SYSTEMET MÅSTE KUNNA I MVP
Måste fungera

visa alla poster

visa en post i detalj

skapa ny post

visa kommentarer

lägga till kommentar

visa begrepp för en post

koppla begrepp till en post

visa aktivitetslogg

visa enkel analys

Får vara bonus

ordmatchning i fritext

färgmarkering av begrepp i text

mer avancerad visualisering

förbättrad filtrering och sökning

10. SYSTEMETS HUVUDFLÖDEN
Flöde 1 – lista poster

frontend anropar GET /api/posts

backend hämtar poster via JOIN mot användare och kategorier

frontend visar postlista

Flöde 2 – skapa post

användaren fyller i formulär

frontend skickar POST /api/posts

backend gör INSERT i Poster

databastriggern skapar loggrad i AktivitetLogg

frontend uppdaterar listan

Flöde 3 – öppna post

frontend hämtar post

frontend hämtar kommentarer

frontend hämtar begrepp kopplade till posten

allt visas på detaljsidan

Flöde 4 – koppla begrepp

frontend visar lista av begrepp

användaren väljer begrepp

frontend skickar POST /api/posts/{post_id}/concepts

backend gör INSERT i PostBegrepp

frontend visar uppdaterad lista

Flöde 5 – analys

frontend anropar analytics-endpoint

backend returnerar summerad data

frontend visar tabeller eller kort

11. TEAM UNDER HUVEN – HUR CURSOR SKA TÄNKA

Cursor ska arbeta som följande team:

Systemarkitekt

Säkerställer att allt hänger ihop.

Databasarkitekt

Säkerställer att backend verkligen följer databasen.

Python-backendutvecklare

Bygger API och SQL-frågor.

Frontendutvecklare

Bygger gränssnittet.

UX-designer

Håller UI rent och begripligt.

QA/testare

Verifierar att allt fungerar.

Dokumentationsansvarig

Håller README och kontrakt uppdaterade.

12. ARBETSPRINCIPER FÖR CURSOR

bygg i små steg

verifiera varje steg

håll SQL nära databasen

använd tydliga kommentarer i koden

gissa inte schema

bygg inte bonus före kärna

gör systemet lätt att förklara

13. KLARDEFINITION FÖR PROJEKTET

Projektet räknas som bra när:

backend startar

frontend startar

databasanslutning fungerar

poster kan hämtas

poster kan skapas

kommentarer fungerar

begrepp fungerar

aktivitet loggas

analysdata visas

allt går att demo-köra från början till slut

14. REKOMMENDERAD IMPLEMENTATIONSSTRATEGI

Bygg i denna ordning:

backend start + db-health

users/categories GET

posts GET

create post

post detail

comments

concepts

activity log

analytics

polish

bonus

15. POSITIONERING AV PRODUKTEN

Systemet ska beskrivas så här:

Reflektionsarkiv är en liten webbapplikation ovanpå en relationsdatabas där användare kan skriva poster i olika kategorier, koppla dem till begrepp, kommentera dem och analysera återkommande teman.

Systemet ska inte beskrivas som:

AI-tolkare

sanningsmaskin

Storytel för drömmar

16. VIKTIGASTE SANNINGEN

Databasen är projektets kärna.
Backend och frontend finns för att göra databasen begriplig och användbar.

Det är så Cursor ska tänka genom hela bygget.


---

```md
# 02_API_CONTRACT.md
## Full API-spec för Reflektionsarkiv

Författare: ChatGPT  
Syfte: ge Cursor exakta API-kontrakt så att backend och frontend inte glider isär

---

# 1. GRUNDREGLER

- Alla endpoints ligger under `/api`
- Alla svar returneras som JSON
- Alla fel ska returnera tydlig statuskod och tydligt felmeddelande
- Alla datum returneras i ISO-format om möjligt
- Backend ska inte returnera onödigt mycket intern information

---

# 2. STANDARD FELFORMAT

Alla fel bör returneras ungefär så här:

```json
{
  "error": "Not found",
  "detail": "Post with id 999 does not exist"
}
3. HEALTH
GET /api/health
Syfte

Kontrollera att backend är igång.

Response 200
{
  "status": "ok"
}
GET /api/db-health
Syfte

Kontrollera att backend kan prata med databasen.

Response 200
{
  "status": "ok",
  "database": "connected"
}
Response 500
{
  "error": "Database connection failed"
}
4. USERS
GET /api/users
Syfte

Hämta alla användare.

Response 200
[
  {
    "anvandar_id": 1,
    "anvandarnamn": "Joakim Emilsson",
    "epost": "joakim@example.com",
    "skapad_datum": "2026-03-15T12:00:00"
  }
]
GET /api/users/{user_id}
Syfte

Hämta en användare.

Response 200
{
  "anvandar_id": 1,
  "anvandarnamn": "Joakim Emilsson",
  "epost": "joakim@example.com",
  "skapad_datum": "2026-03-15T12:00:00"
}
Response 404
{
  "error": "Not found",
  "detail": "User not found"
}
POST /api/users
Syfte

Skapa ny användare.

Request body
{
  "anvandarnamn": "Ny användare",
  "epost": "ny@example.com"
}
Response 201
{
  "anvandar_id": 4,
  "anvandarnamn": "Ny användare",
  "epost": "ny@example.com"
}
Response 400
{
  "error": "Validation error",
  "detail": "Epost already exists"
}
5. CATEGORIES
GET /api/categories
Syfte

Hämta alla kategorier.

Response 200
[
  {
    "kategori_id": 1,
    "namn": "drom",
    "beskrivning": "Poster om drömmar och nattliga upplevelser"
  }
]
GET /api/categories/{category_id}
Response 200
{
  "kategori_id": 1,
  "namn": "drom",
  "beskrivning": "Poster om drömmar och nattliga upplevelser"
}
Response 404
{
  "error": "Not found",
  "detail": "Category not found"
}
6. POSTS
GET /api/posts
Syfte

Hämta alla poster i listvy.

Response 200
[
  {
    "post_id": 1,
    "titel": "Dröm om orm i tempel",
    "innehall": "Jag drömde om en svart orm i ett tempel.",
    "synlighet": "privat",
    "skapad_datum": "2026-03-15T12:00:00",
    "anvandar": {
      "anvandar_id": 1,
      "anvandarnamn": "Joakim Emilsson"
    },
    "kategori": {
      "kategori_id": 1,
      "namn": "drom"
    }
  }
]
GET /api/posts/{post_id}
Syfte

Hämta en post i detalj.

Response 200
{
  "post_id": 1,
  "titel": "Dröm om orm i tempel",
  "innehall": "Jag drömde om en svart orm i ett tempel.",
  "synlighet": "privat",
  "skapad_datum": "2026-03-15T12:00:00",
  "anvandar": {
    "anvandar_id": 1,
    "anvandarnamn": "Joakim Emilsson"
  },
  "kategori": {
    "kategori_id": 1,
    "namn": "drom"
  }
}
Response 404
{
  "error": "Not found",
  "detail": "Post not found"
}
POST /api/posts
Syfte

Skapa ny post.

Request body
{
  "anvandar_id": 1,
  "kategori_id": 1,
  "titel": "Dröm om vatten",
  "innehall": "Jag drömde om vatten och ett tempel.",
  "synlighet": "privat"
}
Response 201
{
  "post_id": 7,
  "message": "Post created"
}
Response 400
{
  "error": "Validation error",
  "detail": "Titel is required"
}
PUT /api/posts/{post_id}
Syfte

Uppdatera post.

Request body
{
  "titel": "Ny titel",
  "innehall": "Uppdaterat innehåll",
  "synlighet": "publik"
}
Response 200
{
  "message": "Post updated"
}
DELETE /api/posts/{post_id}
Syfte

Ta bort en post och dess beroenden på kontrollerat sätt.

Response 200
{
  "message": "Post deleted"
}
Response 404
{
  "error": "Not found",
  "detail": "Post not found"
}
7. COMMENTS
GET /api/posts/{post_id}/comments
Syfte

Hämta kommentarer till en viss post.

Response 200
[
  {
    "kommentar_id": 1,
    "kommentar_text": "Spännande dröm.",
    "skapad_datum": "2026-03-15T12:00:00",
    "anvandare": {
      "anvandar_id": 2,
      "anvandarnamn": "Anna Svensson"
    }
  }
]
POST /api/posts/{post_id}/comments
Request body
{
  "anvandar_id": 2,
  "kommentar_text": "Det här känns som en stark symbol."
}
Response 201
{
  "kommentar_id": 6,
  "message": "Comment created"
}
DELETE /api/comments/{comment_id}
Response 200
{
  "message": "Comment deleted"
}
8. CONCEPTS
GET /api/concepts
Response 200
[
  {
    "begrepp_id": 1,
    "ord": "orm",
    "beskrivning": "Kan kopplas till instinkt, rädsla, förändring eller något dolt."
  }
]
GET /api/concepts/{concept_id}
Response 200
{
  "begrepp_id": 1,
  "ord": "orm",
  "beskrivning": "Kan kopplas till instinkt, rädsla, förändring eller något dolt."
}
POST /api/concepts
Request body
{
  "ord": "skugga",
  "beskrivning": "Kan kopplas till dolda sidor eller det omedvetna."
}
Response 201
{
  "begrepp_id": 7,
  "message": "Concept created"
}
PUT /api/concepts/{concept_id}
Request body
{
  "ord": "svart",
  "beskrivning": "Ny beskrivning"
}
Response 200
{
  "message": "Concept updated"
}
DELETE /api/concepts/{concept_id}
Response 200
{
  "message": "Concept deleted"
}
9. POST-CONCEPT LINKS
GET /api/posts/{post_id}/concepts
Response 200
[
  {
    "post_begrepp_id": 1,
    "begrepp": {
      "begrepp_id": 1,
      "ord": "orm",
      "beskrivning": "Kan kopplas till instinkt, rädsla, förändring eller något dolt."
    }
  }
]
POST /api/posts/{post_id}/concepts
Request body
{
  "begrepp_id": 1,
}
Response 201
{
  "post_begrepp_id": 9,
  "message": "Concept linked to post"
}
DELETE /api/post-concepts/{post_begrepp_id}
Response 200
{
  "message": "Post concept link deleted"
}
10. ACTIVITY
GET /api/activity
Response 200
[
  {
    "logg_id": 1,
    "post_id": 1,
    "anvandar_id": 1,
    "handelse": "Ny post skapad",
    "tidpunkt": "2026-03-15T12:00:00"
  }
]
GET /api/activity/post/{post_id}
Response 200
[
  {
    "logg_id": 1,
    "post_id": 1,
    "anvandar_id": 1,
    "handelse": "Ny post skapad",
    "tidpunkt": "2026-03-15T12:00:00"
  }
]
11. ANALYTICS
GET /api/analytics/posts-per-category
Response 200
[
  {
    "kategori_id": 1,
    "kategori": "drom",
    "antal_poster": 2
  },
  {
    "kategori_id": 4,
    "kategori": "reflektion",
    "antal_poster": 1
  }
]
GET /api/analytics/posts-per-user
Response 200
[
  {
    "anvandar_id": 1,
    "anvandarnamn": "Joakim Emilsson",
    "antal_poster": 2
  }
]
GET /api/analytics/most-used-concepts
Response 200
[
  {
    "begrepp_id": 1,
    "ord": "orm",
    "antal_kopplingar": 2
  }
]
GET /api/analytics/posts-without-comments
Response 200
[
  {
    "post_id": 3,
    "titel": "Tanke om vatten"
  }
]
12. BONUS – TEXT MATCH
POST /api/analyze/text-concepts
Syfte

Matcha ord i text mot databasen Begrepp.

Request body
{
  "text": "Jag drömde om en svart orm i ett tempel."
}
Response 200
{
  "matches": [
    {
      "ord": "orm",
      "begrepp_id": 1,
      "beskrivning": "Kan kopplas till instinkt, rädsla, förändring eller något dolt."
    },
    {
      "ord": "svart",
      "begrepp_id": 4,
      "beskrivning": "Kan kopplas till skugga, okändhet, natt eller djup."
    },
    {
      "ord": "tempel",
      "begrepp_id": 3,
      "beskrivning": "Kan symbolisera ett inre rum, sökande eller det heliga."
    }
  ]
}
13. STATUSKODER SOM SKA ANVÄNDAS

200 när något hämtats eller uppdaterats korrekt

201 när något skapats

400 vid valideringsfel

404 när resurs saknas

500 vid internt backend- eller databasfel

14. VIKTIGT FÖR CURSOR

Det här kontraktet ska vara styrande.

Backend ska byggas så att response-formaten håller ihop.
Frontend ska byggas så att den följer dessa kontrakt.
Ingen sida eller endpoint ska hitta på egna fält utan tydlig anledning.


---

```md
# 03_CURSOR_BUILD_ORDER.md
## Exakt byggordning för Cursor – från 0 till fungerande system

Författare: ChatGPT  
Syfte: ge Cursor en strikt, praktisk körordning utan gissningar

---

# 1. ÖVERGRIPANDE PRINCIP

Bygg inte allt samtidigt.  
Bygg i små steg.  
Verifiera varje steg innan nästa.

Varje fas ska ha:
- mål
- filer som ska skapas
- vad som ska fungera
- hur det testas
- vad som räknas som klart

---

# 2. FAS 0 – PROJEKTSTRUKTUR

## Mål
Skapa backend- och frontend-mappar med ren struktur.

## Skapa dessa mappar
```text
project-root/
  backend/
  frontend/
Backend – skapa grundstruktur
backend/
  app/
    main.py
    db.py
    config.py
    routers/
    repositories/
    schemas/
    services/
  requirements.txt
  .env.example
Frontend – skapa grundstruktur

Om React + Vite:

frontend/
  src/
    main.tsx
    App.tsx
    pages/
    components/
    services/
    types/
    styles/
Klart när

båda projekten finns

båda kan startas som tomma skal

3. FAS 1 – BACKEND STARTAR
Mål

Få FastAPI att starta.

Bygg

backend/app/main.py

enkel FastAPI-app

Måste fungera

GET /api/health

Test

Starta backend och öppna:

/api/health

Klart när

Response är:

{"status":"ok"}
4. FAS 2 – DATABASANSLUTNING
Mål

Få backend att ansluta till MySQL.

Bygg

config.py

db.py

.env.example

Miljövariabler

DB_HOST

DB_PORT

DB_NAME

DB_USER

DB_PASSWORD

Måste fungera

GET /api/db-health

Test

Anropa endpointen.

Klart när

Response visar att databasen är uppkopplad.

5. FAS 3 – USERS OCH CATEGORIES
Mål

Få första riktiga dataläsningen från databasen att fungera.

Bygg filer

routers/users.py

routers/categories.py

repositories/user_repo.py

repositories/category_repo.py

schemas/users.py

schemas/categories.py

Endpoints

GET /api/users

GET /api/users/{id}

POST /api/users

GET /api/categories

GET /api/categories/{id}

Test

se att riktiga användare hämtas

se att kategorier hämtas

testa 404

Klart när

Alla endpoints returnerar korrekt JSON enligt kontraktet.

6. FAS 4 – POSTS READ
Mål

Få listvy och detaljvy för poster.

Bygg filer

routers/posts.py

repositories/post_repo.py

schemas/posts.py

Endpoints

GET /api/posts

GET /api/posts/{id}

Viktigt

Här ska JOIN mot:

Anvandare

Kategorier
användas direkt.

Test

listan returnerar poster

en enskild post returneras

404 fungerar

Klart när

Poster syns korrekt med användare och kategori.

7. FAS 5 – FRONTEND BAS
Mål

Få frontend att starta och visa riktiga poster från API.

Bygg

pages/PostsPage.tsx

components/PostList.tsx

components/PostCard.tsx

services/api.ts

types/posts.ts

Måste fungera

frontend hämtar GET /api/posts

poster visas i lista

Klart när

Du kan öppna appen och se poster från databasen.

8. FAS 6 – CREATE POST
Mål

Kunne skapa en ny post från frontend.

Bygg backend

POST /api/posts

Bygg frontend

pages/NewPostPage.tsx

components/PostForm.tsx

Formfält

användare

kategori

titel

innehåll

synlighet

Test

skapa en post

kontrollera att den finns i listan

kontrollera att triggern har skapat loggrad

Klart när

Post kan skapas från UI och sparas i databasen.

9. FAS 7 – POST DETAIL
Mål

Visa en post i detalj.

Bygg frontend

pages/PostDetailPage.tsx

Ska visa

titel

innehåll

användare

kategori

datum

synlighet

Test

Klick från postlista till detaljsida.

Klart när

Detaljsidan visar en riktig post.

10. FAS 8 – COMMENTS
Mål

Visa och skapa kommentarer.

Bygg backend

GET /api/posts/{id}/comments

POST /api/posts/{id}/comments

DELETE /api/comments/{id}

Bygg frontend

components/CommentList.tsx

components/CommentForm.tsx

Test

öppna postdetalj

se kommentarer

lägg till kommentar

ta bort kommentar

Klart när

Kommentarsflödet fungerar från UI till databas.

11. FAS 9 – CONCEPTS
Mål

Visa begreppsbibliotek och koppla begrepp till poster.

Bygg backend

GET /api/concepts

GET /api/concepts/{id}

POST /api/concepts

PUT /api/concepts/{id}

DELETE /api/concepts/{id}

GET /api/posts/{id}/concepts

POST /api/posts/{id}/concepts

DELETE /api/post-concepts/{id}

Bygg frontend

pages/ConceptsPage.tsx

components/ConceptList.tsx

components/ConceptForm.tsx

components/ConceptPicker.tsx

Test

visa begrepp

skapa nytt begrepp

koppla begrepp till post

se kopplade begrepp på detaljsidan

Klart när

Poster kan kopplas till begrepp från UI.

12. FAS 10 – ACTIVITY LOG
Mål

Visa att triggern faktiskt fungerar i systemet.

Bygg backend

GET /api/activity

GET /api/activity/post/{id}

Bygg frontend

pages/ActivityPage.tsx

components/ActivityTable.tsx

Test

skapa ny post

öppna activity-sidan

se ny loggrad

Klart när

Triggerkedjan syns i UI.

13. FAS 11 – ANALYTICS
Mål

Visa summerad data från databasen.

Bygg backend

GET /api/analytics/posts-per-category

GET /api/analytics/posts-per-user

GET /api/analytics/most-used-concepts

GET /api/analytics/posts-without-comments

Bygg frontend

pages/AnalyticsPage.tsx

components/StatsCards.tsx

components/AnalyticsTable.tsx

Test

öppna analyssidan

kontrollera att data ser rimlig ut

Klart när

Databasen kan demonstreras som mer än bara CRUD.

14. FAS 12 – EDIT OCH DELETE
Mål

Slutföra CRUD där det är rimligt.

Bygg backend

PUT /api/posts/{id}

DELETE /api/posts/{id}

PUT /api/concepts/{id}

DELETE /api/concepts/{id}

Bygg frontend

edit-funktion för post

delete-funktion för post

edit/delete för begrepp

Test

uppdatera post

radera post

kontrollera beroenden och transaktion

Klart när

CRUD känns komplett.

15. FAS 13 – BONUS TEXT MATCH
Mål

Bygga enkel matchning mellan fri text och begrepp.

Bygg backend

POST /api/analyze/text-concepts

Bygg frontend

enkel textarea

knapp “analysera text”

träfflista

Test

mata in text:

"Jag drömde om en svart orm i ett tempel"

förväntad träff:

orm

svart

tempel

Klart när

Bonusfunktionen fungerar utan AI.

16. FAS 14 – POLISH
Mål

Göra systemet lugnt, tydligt och demo-vänligt.

Lägg till

loading states

empty states

felmeddelanden

bättre spacing

bättre knappar

bättre navigation

Klart när

Systemet känns färdigt nog att visa upp.

17. DONE-DEFINITION PER FAS

En fas är bara klar när:

koden kör

endpointen testats

frontend visar korrekt data

felhantering är rimlig

dokumentation uppdaterats

Inte bara när koden “ser klar ut”.

18. MINSTA ACCEPTANSTEST FÖR HELA SYSTEMET

Följande ska gå att demonstrera utan att något bryter:

öppna frontend

se lista av poster

öppna en post

skapa ny post

se aktivitet skapad av trigger

lägga till kommentar

koppla begrepp

öppna analyssida

se statistik

backend health fungerar

db-health fungerar

19. REGLER FÖR CURSOR UNDER BYGGET

ändra inte databasschemat utan skäl

följ API-kontraktet

skriv kommentarer i koden

håll SQL begriplig

bygg inte bonus före kärna

verifiera varje fas

dokumentera vad som är klart

20. SLUTLIG ARBETSFORMEL

Bygg → kör → testa → verifiera → dokumentera → gå vidare

Detta dokument är den praktiska körordningen.


---

```md
# 04_FRONTEND_SPEC.md
## Frontendspec för Reflektionsarkiv

Författare: ChatGPT  
Syfte: ge Cursor en exakt frontendbild utan att frontend blir överdrivet stor eller vag

---

# 1. FRONTENDENS ROLL

Frontendens uppgift är inte att vara “smartare” än databasen.  
Frontendens uppgift är att:

- visa datan tydligt
- låta användaren skapa och läsa data
- göra relationerna begripliga
- ge en lugn och seriös känsla

Frontend ska alltså hjälpa användaren att förstå systemet, inte skapa illusion av AI.

---

# 2. DESIGNMÅL

Frontend ska kännas:

- lugn
- ren
- tydlig
- lite premium men inte flashig
- läsbar
- strukturerad

Frontend ska inte kännas:

- plottrig
- mystisk
- övertolkande
- överdrivet färgstark
- som sociala medier

---

# 3. VISUELL RIKTNING

## Färger
- ljus bakgrund
- neutrala grå toner
- diskreta accentfärger
- grönt kan användas försiktigt för träffade begrepp i bonusfunktion

## Typografi
- systemfont eller ren sans-serif
- tydliga rubriker
- bra luft mellan element
- postinnehåll ska vara lätt att läsa

## Former
- rundade hörn men inte extrema
- kort med mjuk skugga
- tydliga knappar

---

# 4. LAYOUT

## Desktop
Tre huvudzoner:

### Vänster navigation
- Dashboard
- Poster
- Ny post
- Begrepp
- Analys
- Aktivitet

### Huvudyta
Visar aktuell sida.

### Högerkolumn
Kan i första versionen utelämnas.
Senare kan den visa:
- begrepp
- metadata
- hjälptext

## Mobil
Inte huvudfokus, men layouten ska inte vara helt sönder på mindre skärmar.

---

# 5. SIDOR SOM MÅSTE FINNAS

## 5.1 Dashboard
Syfte:
- ge snabb överblick

Ska visa:
- antal poster
- antal användare
- antal begrepp
- antal kommentarer
- senaste poster
- snabbknapp för ny post

---

## 5.2 Posts Page
Syfte:
- visa alla poster

Ska visa per post:
- titel
- kategori
- användare
- datum
- synlighet
- kort utdrag ur innehållet

Ska kunna:
- klicka till detalj
- filtrera enkelt senare
- skapa ny post via knapp

---

## 5.3 New Post Page
Syfte:
- skapa ny post

Formulärfält:
- användare (dropdown)
- kategori (dropdown)
- titel (textfält)
- innehåll (textarea)
- synlighet (dropdown)

Knappar:
- spara
- avbryt

Bonus:
- knapp “matcha begrepp i text”

---

## 5.4 Post Detail Page
Syfte:
- visa allt om en enskild post

Ska visa:
- titel
- innehåll
- användare
- kategori
- datum
- synlighet

Sektioner:
- kopplade begrepp
- kommentarer
- aktivitet för denna post (kan vara bonus i detaljvyn)

Knappar:
- redigera post
- radera post
- lägg till kommentar
- koppla begrepp

---

## 5.5 Concepts Page
Syfte:
- visa begreppsbiblioteket

Ska visa:
- ord
- beskrivning
- knapp för att skapa nytt begrepp
- knapp för att redigera
- knapp för att ta bort

---

## 5.6 Analytics Page
Syfte:
- visa att databasen kan sammanställa data

Ska visa:
- poster per kategori
- poster per användare
- mest använda begrepp
- poster utan kommentarer

Visningsform:
- tabeller eller enkla statistik-kort
- inga avancerade grafer krävs

---

## 5.7 Activity Page
Syfte:
- visa trigger-logg

Ska visa:
- logg-ID
- post-ID
- användar-ID
- händelse
- tidpunkt

---

# 6. KOMPONENTER SOM BÖR FINNAS

## Layout-komponenter
- `Layout`
- `Sidebar`
- `TopBar`
- `PageHeader`

## Post-komponenter
- `PostList`
- `PostCard`
- `PostForm`
- `PostDetail`

## Kommentar-komponenter
- `CommentList`
- `CommentForm`

## Begreppskomponenter
- `ConceptList`
- `ConceptForm`
- `ConceptPicker`

## Analytics-komponenter
- `StatsCards`
- `AnalyticsTable`

## Aktivitet
- `ActivityTable`

---

# 7. DATAHANTERING I FRONTEND

Frontend ska ha en enkel service-modul, exempelvis:

```text
src/services/api.ts
src/services/posts.ts
src/services/comments.ts
src/services/concepts.ts
src/services/analytics.ts

Varje service ska:

anropa rätt endpoint

returnera JSON

kasta tydliga fel vid problem

Frontend ska inte innehålla SQL eller logik som borde ligga i backend.

8. TYPER SOM BÖR FINNAS I FRONTEND
User
type User = {
  anvandar_id: number;
  anvandarnamn: string;
  epost: string;
  skapad_datum: string;
};
Category
type Category = {
  kategori_id: number;
  namn: string;
  beskrivning: string | null;
};
Post
type Post = {
  post_id: number;
  titel: string;
  innehall: string;
  synlighet: "privat" | "publik";
  skapad_datum: string;
  anvandar: {
    anvandar_id: number;
    anvandarnamn: string;
  };
  kategori: {
    kategori_id: number;
    namn: string;
  };
};
Comment
type Comment = {
  kommentar_id: number;
  kommentar_text: string;
  skapad_datum: string;
  anvandare: {
    anvandar_id: number;
    anvandarnamn: string;
  };
};
Concept
type Concept = {
  begrepp_id: number;
  ord: string;
  beskrivning: string;
};
PostConcept
type PostConcept = {
  post_begrepp_id: number;
  begrepp: Concept;
};
9. VIKTIGA UX-REGLER
9.1 Användaren ska alltid förstå var hen är

Varje sida ska ha tydlig rubrik.

9.2 Formulär ska vara enkla

Inga för många fält samtidigt.

9.3 Data ska visas i mänsklig ordning

Nyaste poster överst.
Kommentarer i läsordning.
Begrepp alfabetiskt eller efter koppling.

9.4 Tomma lägen ska hanteras snyggt

Exempel:

“Inga kommentarer ännu”

“Inga begrepp kopplade”

“Inga poster hittades”

9.5 Fel ska vara begripliga

Exempel:

“Kunde inte hämta poster”

“Posten kunde inte sparas”

10. BONUSFUNKTION – ORDMATCHNING

Denna är bonus, inte kärna.

Hur det kan se ut

På sidan “Ny post” eller “Post detail” kan användaren ha:

textarea med text

knapp: “Matcha begrepp”

resultatlista under eller vid sidan

Exempel:
Text:

Jag drömde om en svart orm i ett tempel.

Resultat:

orm

svart

tempel

Frontend kan senare markera ord visuellt, men första versionen räcker det att visa träfflista.

11. EXAKT VAD DASHBOARDEN SKA VISA

Dashboard ska vara enkel.

Överkant – statistik

antal poster

antal användare

antal begrepp

antal kommentarer

Under – senaste poster

Kort lista med 5 senaste posterna.

Under – snabbgenvägar

skapa ny post

gå till begrepp

öppna analys

12. EXAKT VAD POST LIST SKA VISA

Varje PostCard ska visa:

titel

kategori

användare

datum

synlighet

de första 120–180 tecknen av innehållet

Knappar/länkar:

öppna

redigera

radera

13. EXAKT VAD POST DETAIL SKA VISA
Huvuddel

titel

innehåll i tydlig läsyta

metadata-rad:

användare

kategori

synlighet

datum

Begrepp-sektion

lista av kopplade begrepp

relationstyp

kommentar

möjlighet att lägga till koppling

Kommentar-sektion

kommentarlista

formulär för ny kommentar

14. REKOMMENDERAD KODSTRUKTUR I FRONTEND
frontend/src/
  main.tsx
  App.tsx
  pages/
    DashboardPage.tsx
    PostsPage.tsx
    NewPostPage.tsx
    PostDetailPage.tsx
    ConceptsPage.tsx
    AnalyticsPage.tsx
    ActivityPage.tsx
  components/
    Layout.tsx
    Sidebar.tsx
    TopBar.tsx
    PageHeader.tsx
    PostList.tsx
    PostCard.tsx
    PostForm.tsx
    PostDetail.tsx
    CommentList.tsx
    CommentForm.tsx
    ConceptList.tsx
    ConceptForm.tsx
    ConceptPicker.tsx
    StatsCards.tsx
    AnalyticsTable.tsx
    ActivityTable.tsx
  services/
    api.ts
    posts.ts
    comments.ts
    concepts.ts
    analytics.ts
    users.ts
    categories.ts
    activity.ts
  types/
    users.ts
    categories.ts
    posts.ts
    comments.ts
    concepts.ts
    analytics.ts
  styles/
    globals.css
15. FRONTENDENS PRIORITERING

Bygg i denna ordning:

Layout

Posts page

New post

Post detail

Comments

Concepts

Dashboard

Analytics

Activity

Bonus text match

16. KLARDEFINITION FÖR FRONTEND

Frontend är tillräckligt bra när:

man kan navigera mellan sidor

poster syns tydligt

post kan skapas

kommentarer fungerar

begrepp fungerar

analys syns

triggerlogg syns

det känns lugnt och tydligt

17. FRONTENDENS KÄRNFORMULERING

Frontend ska se ut som ett tydligt reflektionsarkiv, inte som en magisk tolkare.

Det betyder:

enkel

ren

begriplig

datadriven

Det är den riktning Cursor ska följa.

# 05_BACKEND_SQL_MAP.md
## Exakt SQL per endpoint + backendstruktur för Reflektionsarkiv

Författare: ChatGPT  
Syfte: ge Cursor en nästan direkt implementerbar karta från API-endpoint -> Python-fil -> SQL-query -> response-shape

---

# 1. VIKTIG PRINCIP

Det här dokumentet är till för att minimera gissningar.

Cursor ska använda detta så här:

1. hitta endpoint
2. se vilken router-fil som ska innehålla den
3. se vilket repository som ska äga SQL-frågan
4. använda SQL-frågan som startpunkt
5. bygga schema/response enligt kontraktet
6. verifiera mot verklig databas

Detta dokument utgår från att databasen redan finns och har tabellerna:

- `Anvandare`
- `Kategorier`
- `Poster`
- `Begrepp`
- `PostBegrepp`
- `AktivitetLogg`

---

# 2. REKOMMENDERAD BACKENDSTRUKTUR

```text
backend/
  app/
    main.py
    config.py
    db.py
    routers/
      health.py
      users.py
      categories.py
      posts.py
      comments.py
      concepts.py
      activity.py
      analytics.py
      analyze.py
    repositories/
      health_repo.py
      user_repo.py
      category_repo.py
      post_repo.py
      comment_repo.py
      concept_repo.py
      activity_repo.py
      analytics_repo.py
      analyze_repo.py
    schemas/
      users.py
      categories.py
      posts.py
      comments.py
      concepts.py
      activity.py
      analytics.py
      analyze.py
    services/
      post_service.py
      concept_service.py
      analytics_service.py
Praktisk princip

routers/ = HTTP-endpoints

repositories/ = rena SQL-frågor

schemas/ = request/response-modeller

services/ = lätt logik om det behövs

db.py = connection / cursor-hantering

Viktig regel:
lägg SQL i repositories, inte i routers

3. DB.PY – HUR DATABASANSLUTNINGEN BÖR FUNGIERA

Cursor bör bygga en enkel DB-access med:

connection-factory

dictionary cursor

tydlig commit/rollback-hantering

enkel helper för read vs write

Rekommenderad riktning

Om mysql-connector-python används:

använd dictionary=True så responses blir lättare att mappa

Minsta behov

db.py ska kunna:

skapa connection

returnera cursor

stänga cursor/connection korrekt

hantera rollback vid fel i write-flöden

4. HEALTH
Router-fil

app/routers/health.py

Repository-fil

app/repositories/health_repo.py

ENDPOINT: GET /api/health
Syfte

Kontrollera att backend är igång.

SQL

Ingen SQL behövs.

Response
{
  "status": "ok"
}
ENDPOINT: GET /api/db-health
Syfte

Kontrollera att backend kan prata med databasen.

SQL
SELECT 1 AS ok;
Förväntad response
{
  "status": "ok",
  "database": "connected"
}
Felresponse
{
  "error": "Database connection failed"
}
5. USERS
Router-fil

app/routers/users.py

Repository-fil

app/repositories/user_repo.py

Schema-fil

app/schemas/users.py

ENDPOINT: GET /api/users
Syfte

Hämta alla användare.

SQL
SELECT
    AnvandarID,
    Anvandarnamn,
    Epost,
    SkapadDatum
FROM Anvandare
ORDER BY AnvandarID;
Return shape

Lista av användare.

ENDPOINT: GET /api/users/{user_id}
Syfte

Hämta en användare.

SQL
SELECT
    AnvandarID,
    Anvandarnamn,
    Epost,
    SkapadDatum
FROM Anvandare
WHERE AnvandarID = %s;
Om ingen rad hittas

Returnera 404.

ENDPOINT: POST /api/users
Syfte

Skapa ny användare.

Request body
{
  "anvandarnamn": "Ny användare",
  "epost": "ny@example.com"
}
SQL
INSERT INTO Anvandare (
    Anvandarnamn,
    Epost
)
VALUES (%s, %s);
Efter insert

Hämta lastrowid och returnera nyskapad användare eller id + message.

Möjligt fel

UNIQUE på e-post kan slå.
Mappa detta till 400 eller 409.

6. CATEGORIES
Router-fil

app/routers/categories.py

Repository-fil

app/repositories/category_repo.py

Schema-fil

app/schemas/categories.py

ENDPOINT: GET /api/categories
SQL
SELECT
    KategoriID,
    Namn,
    Beskrivning
FROM Kategorier
ORDER BY Namn;
ENDPOINT: GET /api/categories/{category_id}
SQL
SELECT
    KategoriID,
    Namn,
    Beskrivning
FROM Kategorier
WHERE KategoriID = %s;
Om ingen rad hittas

Returnera 404.

7. POSTS
Router-fil

app/routers/posts.py

Repository-fil

app/repositories/post_repo.py

Schema-fil

app/schemas/posts.py

Service-fil

app/services/post_service.py om Cursor vill samla delete-logik eller payload-mapning

ENDPOINT: GET /api/posts
Syfte

Hämta alla poster till listvyn.

SQL
SELECT
    p.PostID,
    p.Titel,
    p.Innehall,
    p.Synlighet,
    p.SkapadDatum,
    a.AnvandarID,
    a.Anvandarnamn,
    k.KategoriID,
    k.Namn AS KategoriNamn
FROM Poster p
INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
ORDER BY p.SkapadDatum DESC, p.PostID DESC;
Mapping till response

Backend ska mappa rader till:

{
  "post_id": 1,
  "titel": "...",
  "innehall": "...",
  "synlighet": "privat",
  "skapad_datum": "...",
  "anvandar": {
    "anvandar_id": 1,
    "anvandarnamn": "Joakim"
  },
  "kategori": {
    "kategori_id": 1,
    "namn": "drom"
  }
}
ENDPOINT: GET /api/posts/{post_id}
Syfte

Hämta en post i detalj.

SQL
SELECT
    p.PostID,
    p.Titel,
    p.Innehall,
    p.Synlighet,
    p.SkapadDatum,
    a.AnvandarID,
    a.Anvandarnamn,
    k.KategoriID,
    k.Namn AS KategoriNamn
FROM Poster p
INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
WHERE p.PostID = %s;
Om ingen rad hittas

Returnera 404.

ENDPOINT: POST /api/posts
Syfte

Skapa ny post.

Request body
{
  "anvandar_id": 1,
  "kategori_id": 1,
  "titel": "Dröm om vatten",
  "innehall": "Jag drömde om vatten och ett tempel.",
  "synlighet": "privat"
}
SQL
INSERT INTO Poster (
    AnvandarID,
    KategoriID,
    Titel,
    Innehall,
    Synlighet
)
VALUES (%s, %s, %s, %s, %s);
Viktigt

När denna INSERT körs kommer databastriggern skapa en rad i AktivitetLogg.

Validering i backend

titel får inte vara tom

innehall får inte vara tom

synlighet måste vara privat eller publik

Response

Helst:

{
  "post_id": 7,
  "message": "Post created"
}
ENDPOINT: PUT /api/posts/{post_id}
Syfte

Uppdatera post.

SQL
UPDATE Poster
SET
    Titel = %s,
    Innehall = %s,
    Synlighet = %s,
    KategoriID = %s
WHERE PostID = %s;
Kontroll

Om rowcount == 0:

kontrollera om posten inte finns -> 404

annars kan det vara oförändrad data

Rekommendation

Returnera:

{
  "message": "Post updated"
}
ENDPOINT: DELETE /api/posts/{post_id}
Syfte

Ta bort post på kontrollerat sätt.

Viktigt

Pga foreign keys måste beroenden tas bort först.

Rekommenderad ordning i transaktion
DELETE FROM Kommentarer
WHERE PostID = %s;
DELETE FROM PostBegrepp
WHERE PostID = %s;
DELETE FROM AktivitetLogg
WHERE PostID = %s;
DELETE FROM Poster
WHERE PostID = %s;
Backendkrav

kör allt i en transaktion

rollback vid fel

returnera 404 om posten inte finns innan delete-försök

8. COMMENTS
Router-fil

app/routers/comments.py

Repository-fil

app/repositories/comment_repo.py

Schema-fil

app/schemas/comments.py

ENDPOINT: GET /api/posts/{post_id}/comments
Syfte

Hämta alla kommentarer till en post.

SQL
SELECT
    c.KommentarID,
    c.KommentarText,
    c.SkapadDatum,
    a.AnvandarID,
    a.Anvandarnamn
FROM Kommentarer c
INNER JOIN Anvandare a ON c.AnvandarID = a.AnvandarID
WHERE c.PostID = %s
ORDER BY c.SkapadDatum ASC, c.KommentarID ASC;
Return shape

Lista av kommentarer med användarnamn.

ENDPOINT: POST /api/posts/{post_id}/comments
Syfte

Lägga till kommentar.

Request body
{
  "anvandar_id": 2,
  "kommentar_text": "Det här känns som en stark symbol."
}
SQL
INSERT INTO Kommentarer (
    PostID,
    AnvandarID,
    KommentarText
)
VALUES (%s, %s, %s);
Validering

kommentar_text får inte vara tom

post måste finnas

användare måste finnas

Response
{
  "kommentar_id": 6,
  "message": "Comment created"
}
ENDPOINT: DELETE /api/comments/{comment_id}
SQL
DELETE FROM Kommentarer
WHERE KommentarID = %s;
Kontroll

Om ingen rad togs bort -> 404.

9. CONCEPTS / BEGREPP
Router-fil

app/routers/concepts.py

Repository-fil

app/repositories/concept_repo.py

Schema-fil

app/schemas/concepts.py

ENDPOINT: GET /api/concepts
SQL
SELECT
    BegreppID,
    Ord,
    Beskrivning,
    SkapadDatum
FROM Begrepp
ORDER BY Ord ASC;
ENDPOINT: GET /api/concepts/{concept_id}
SQL
SELECT
    BegreppID,
    Ord,
    Beskrivning,
    SkapadDatum
FROM Begrepp
WHERE BegreppID = %s;
Om ingen rad hittas

Returnera 404.

ENDPOINT: POST /api/concepts
Request body
{
  "ord": "skugga",
  "beskrivning": "Kan kopplas till dolda sidor eller det omedvetna."
}
SQL
INSERT INTO Begrepp (
    Ord,
    Beskrivning
)
VALUES (%s, %s);
Validering

ord får inte vara tomt

beskrivning får inte vara tom

ord är UNIQUE

ENDPOINT: PUT /api/concepts/{concept_id}
SQL
UPDATE Begrepp
SET
    Ord = %s,
    Beskrivning = %s
WHERE BegreppID = %s;
ENDPOINT: DELETE /api/concepts/{concept_id}
Viktigt

Om begrepp är kopplat till poster via PostBegrepp måste kopplingar bort först.

Rekommenderad ordning i transaktion
DELETE FROM PostBegrepp
WHERE BegreppID = %s;
DELETE FROM Begrepp
WHERE BegreppID = %s;
10. POST-CONCEPT LINKS / POSTBEGREPP
Router-fil

app/routers/concepts.py eller egen fil post_concepts.py
Min rekommendation: låt detta ligga nära concepts eller posts, men håll det tydligt.

Repository-fil

app/repositories/concept_repo.py eller post_concept_repo.py

ENDPOINT: GET /api/posts/{post_id}/concepts
Syfte

Hämta alla begrepp kopplade till en post.

SQL
SELECT
    pb.PostBegreppID,
    b.BegreppID,
    b.Ord,
    b.Beskrivning
FROM PostBegrepp pb
INNER JOIN Begrepp b ON pb.BegreppID = b.BegreppID
WHERE pb.PostID = %s
ORDER BY b.Ord ASC;
Return shape
{
  "post_begrepp_id": 1,
  "begrepp": {
    "begrepp_id": 1,
    "ord": "orm",
    "beskrivning": "..."
  }
}
ENDPOINT: POST /api/posts/{post_id}/concepts
Request body
{
  "begrepp_id": 1,
}
SQL
INSERT INTO PostBegrepp (
    PostID,
    BegreppID
)
VALUES (%s, %s);
Viktigt

UNIQUE finns på:

(PostID, BegreppID)

Så samma relation får inte dubbelinserteras.

Möjligt fel

Om dublett -> returnera 400 eller 409 med tydligt meddelande.

ENDPOINT: DELETE /api/post-concepts/{post_begrepp_id}
SQL
DELETE FROM PostBegrepp
WHERE PostBegreppID = %s;
11. ACTIVITY
Router-fil

app/routers/activity.py

Repository-fil

app/repositories/activity_repo.py

Schema-fil

app/schemas/activity.py

ENDPOINT: GET /api/activity
SQL
SELECT
    LoggID,
    PostID,
    AnvandarID,
    Handelse,
    Tidpunkt
FROM AktivitetLogg
ORDER BY Tidpunkt DESC, LoggID DESC;
ENDPOINT: GET /api/activity/post/{post_id}
SQL
SELECT
    LoggID,
    PostID,
    AnvandarID,
    Handelse,
    Tidpunkt
FROM AktivitetLogg
WHERE PostID = %s
ORDER BY Tidpunkt DESC, LoggID DESC;
12. ANALYTICS
Router-fil

app/routers/analytics.py

Repository-fil

app/repositories/analytics_repo.py

Schema-fil

app/schemas/analytics.py

ENDPOINT: GET /api/analytics/posts-per-category
Syfte

Visa antal poster per kategori.

Alternativ A – använd vanlig query
SELECT
    k.KategoriID,
    k.Namn AS Kategori,
    COUNT(p.PostID) AS AntalPoster
FROM Kategorier k
LEFT JOIN Poster p ON k.KategoriID = p.KategoriID
GROUP BY k.KategoriID, k.Namn
ORDER BY AntalPoster DESC, k.Namn ASC;
Alternativ B – använd stored procedure

Det går, men kräver datumparametrar.
För en enkel GET är vanlig query oftast smidigare.

ENDPOINT: GET /api/analytics/posts-per-user
SQL
SELECT
    a.AnvandarID,
    a.Anvandarnamn,
    COUNT(p.PostID) AS AntalPoster
FROM Anvandare a
LEFT JOIN Poster p ON a.AnvandarID = p.AnvandarID
GROUP BY a.AnvandarID, a.Anvandarnamn
ORDER BY AntalPoster DESC, a.Anvandarnamn ASC;
ENDPOINT: GET /api/analytics/most-used-concepts
SQL
SELECT
    b.BegreppID,
    b.Ord,
    COUNT(pb.PostBegreppID) AS AntalKopplingar
FROM Begrepp b
LEFT JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
GROUP BY b.BegreppID, b.Ord
ORDER BY AntalKopplingar DESC, b.Ord ASC;
ENDPOINT: GET /api/analytics/posts-without-comments
SQL
SELECT
    p.PostID,
    p.Titel
FROM Poster p
LEFT JOIN Kommentarer c ON p.PostID = c.PostID
WHERE c.KommentarID IS NULL
ORDER BY p.PostID ASC;
BONUS-ENDPOINT: GET /api/analytics/posts-with-many-comments
SQL
SELECT
    p.PostID,
    p.Titel,
    COUNT(c.KommentarID) AS AntalKommentarer
FROM Poster p
LEFT JOIN Kommentarer c ON p.PostID = c.PostID
GROUP BY p.PostID, p.Titel
HAVING COUNT(c.KommentarID) > 1
ORDER BY AntalKommentarer DESC, p.PostID ASC;

Detta är ingen kärnkrav-endpoint, men den är bra om Cursor vill visa HAVING tydligt i UI.

13. ANALYZE / TEXT MATCH BONUS
Router-fil

app/routers/analyze.py

Repository-fil

app/repositories/analyze_repo.py

Schema-fil

app/schemas/analyze.py

ENDPOINT: POST /api/analyze/text-concepts
Syfte

Matcha ord i text mot Begrepp.

Sann teknisk avgränsning

Detta är inte AI.
Detta är enkel regelbaserad ordmatchning.

Enklaste implementering

hämta alla begrepp:

SELECT
    BegreppID,
    Ord,
    Beskrivning
FROM Begrepp
ORDER BY Ord ASC;

i Python:

normalisera text till lowercase

splitta texten i ord

jämför mot Ord

returnera träffar

Viktig kommentar

Denna logik ska inte ligga i SQL.
Den bör ligga i Python-lagret.

14. REKOMMENDERADE SCHEMA-FILER (PYDANTIC)

Detta är inte full kod, men exakt vad Cursor bör skapa.

schemas/users.py

Skapa minst:

UserRead

UserCreate

Fält

UserRead

anvandar_id: int

anvandarnamn: str

epost: str

skapad_datum: datetime

UserCreate

anvandarnamn: str

epost: str

schemas/categories.py

Skapa minst:

CategoryRead

Fält

kategori_id: int

namn: str

beskrivning: str | None

schemas/posts.py

Skapa minst:

PostListItem

PostDetail

PostCreate

PostUpdate

Fält för PostCreate

anvandar_id: int

kategori_id: int

titel: str

innehall: str

synlighet: str

Fält för PostUpdate

kategori_id: int

titel: str

innehall: str

synlighet: str

Fält för PostListItem

post_id: int

titel: str

innehall: str

synlighet: str

skapad_datum: datetime

anvandar: object

kategori: object

schemas/comments.py

Skapa minst:

CommentRead

CommentCreate

CommentCreate

anvandar_id: int

kommentar_text: str

schemas/concepts.py

Skapa minst:

ConceptRead

ConceptCreate

ConceptUpdate

PostConceptRead

PostConceptCreate

PostConceptCreate

begrepp_id: int


schemas/activity.py

Skapa minst:

ActivityRead

Fält

logg_id: int

post_id: int

anvandar_id: int

handelse: str

tidpunkt: datetime

schemas/analytics.py

Skapa minst:

PostsPerCategoryItem

PostsPerUserItem

MostUsedConceptItem

PostWithoutCommentsItem

schemas/analyze.py

Skapa minst:

AnalyzeTextRequest

AnalyzeTextMatch

AnalyzeTextResponse

15. REKOMMENDERADE REPOSITORY-FUNKTIONER

Cursor bör ungefär skapa dessa funktioner.

user_repo.py

get_all_users()

get_user_by_id(user_id)

create_user(anvandarnamn, epost)

category_repo.py

get_all_categories()

get_category_by_id(category_id)

post_repo.py

get_all_posts()

get_post_by_id(post_id)

create_post(payload)

update_post(post_id, payload)

delete_post(post_id)

comment_repo.py

get_comments_by_post_id(post_id)

create_comment(post_id, payload)

delete_comment(comment_id)

concept_repo.py

get_all_concepts()

get_concept_by_id(concept_id)

create_concept(payload)

update_concept(concept_id, payload)

delete_concept(concept_id)

get_concepts_by_post_id(post_id)

link_concept_to_post(post_id, payload)

delete_post_concept(post_begrepp_id)

activity_repo.py

get_all_activity()

get_activity_by_post_id(post_id)

analytics_repo.py

get_posts_per_category()

get_posts_per_user()

get_most_used_concepts()

get_posts_without_comments()

analyze_repo.py

get_all_concepts_minimal()

Denna kan användas av Python-logik i analyze.py.

16. FEL OCH KANTFALL SOM CURSOR MÅSTE HANTERA
Skapa post

ogiltig användare -> 400

ogiltig kategori -> 400

tom titel -> 400

tomt innehåll -> 400

Skapa användare

dublett e-post -> 400/409

Koppla begrepp till post

post saknas -> 404/400

begrepp saknas -> 404/400

samma relation finns redan -> 400/409

Radera post

måste ske i transaktion

rollback om något steg misslyckas

Hämta data

tomma listor ska vara tomma arrayer, inte fel

17. VIKTIG SQL-STYLE SOM CURSOR SKA FÖLJA

använd alias där det förbättrar läsbarheten

välj bara de kolumner som behövs

använd ORDER BY uttryckligen

använd LEFT JOIN endast när det faktiskt behövs

håll queries nära verklig datamodell

göm inte SQL i onödiga abstraktionslager

18. STORED PROCEDURE – HUR DEN KAN EXPONERAS OM CURSOR VILL

Databasen har redan:
hamta_poster_per_kategori(p_fran_datum, p_till_datum)

Detta kan exponeras som bonus-endpoint:

GET /api/analytics/posts-per-category-range?from=2024-01-01&to=2026-12-31
SQL
CALL hamta_poster_per_kategori(%s, %s);
Viktigt

Detta är bonus.
För vanliga analytics räcker vanliga SELECT-frågor.

19. MINSTA VERIFY PER ENDPOINT

För varje endpoint ska Cursor verifiera:

att response kommer tillbaka

att response har rätt struktur

att datan stämmer mot databasen

att felstatus fungerar vid ogiltigt id

att write-endpoints faktiskt påverkar databasen korrekt

20. DETTA DOKUMENTS ROLL

Detta dokument är den praktiska SQL-kartan mellan:

API

Python-filer

databas

response-format

När Cursor börjar koda ska detta användas som närmaste tekniska referens tillsammans med:

planering.md

01_SYSTEM_OVERVIEW.md

02_API_CONTRACT.md

03_CURSOR_BUILD_ORDER.md

04_FRONTEND_SPEC.md

21. EXTRA – 06_IMPLEMENTATION_NOTES.md
Lägg detta i samma docs-mapp om du vill ge Cursor ännu mindre frihetsgrad

Detta dokument är valfritt men rekommenderas.

A. Backend först, alltid

Frontend ska inte byggas före:

/api/health

/api/db-health

GET /api/posts

är verkligt fungerande.

B. Första verkliga demo-målet

Det första riktiga demo-målet bör vara:

backend igång

db-health fungerar

GET /api/posts fungerar

frontend visar postlista

Allt efter det är utbyggnad.

C. Kommentar om text-matchning

Text-matchning mot Begrepp ska vara bonus.
Den får inte blockera kärnan.

D. Kommentar om auth

Bygg inte riktig auth nu.
Om användare behöver väljas, använd dropdown från Anvandare.

E. Kommentar om UI

UI ska vara:

lugnt

ljust

tydligt

data-först

Inte:

mystiskt

överdesignat

“AI-glow” i kärnan

F. Kommentar om dokumentation

Efter varje större fas ska docs/STATUS.md uppdateras med:

klart

pågår

nästa steg

blockerare

G. Kommentar om kommentarer i koden

All central kod ska kommenteras så att Joakim kan läsa och förstå:

varför denna endpoint finns

varför denna query används

varför denna relation behövs

H. Slutlig riktning

Målet är inte att bygga världens största produkt.
Målet är att bygga ett tydligt, fungerande, pedagogiskt system ovanpå den existerande databasen