# Reflektionsarkiv – Databaser  
Joakim Emilsson – YH24

Den här databasen är gjord för att lagra självreflektiva poster, till exempel drömmar, visioner, tankar, reflektioner och dikter.  
Tanken är att man ska kunna se vilka användare som finns, vilka poster de har skrivit, vilken kategori en post tillhör och vilka begrepp som kopplats till posten.

Jag valde att dela upp databasen i flera tabeller för att det skulle bli tydligare och för att samma information inte ska behöva skrivas flera gånger.  
Databasen består därför av tabellerna **Anvandare**, **Kategorier**, **Poster**, **Begrepp**, **PostBegrepp** och **AktivitetLogg**.

Jag ville att databasen skulle vara enkel att förklara men ändå tillräckligt stark för att visa riktiga relationer.  
Därför har jag hållit själva databasen ganska ren, medan mer avancerad logik kan ligga i ett mellanlager ovanpå databasen.

En enkel bild av databasen är:

- **Anvandare** = vem som skriver  
- **Poster** = det som skrivs  
- **Kategorier** = vilken typ av text det är  
- **Begrepp** = ord eller symboler som kan kopplas till texten  
- **PostBegrepp** = bron mellan text och symbolik  
- **AktivitetLogg** = databasen visar att något faktiskt hände

Jag valde att ha en egen tabell för **PostBegrepp** eftersom det annars hade blivit svårt att koppla ihop poster och begrepp på ett bra sätt.  
En post kan ha många begrepp, och samma begrepp kan finnas i många olika poster.  
Därför behövs **PostBegrepp** som kopplingstabell.

Databasen innehåller också index, en trigger, en lagrad procedur, flera JOIN-frågor, GROUP BY, HAVING och transaktioner med ROLLBACK.  
Jag tycker att det gör databasen mer verklig, eftersom den inte bara lagrar data utan också kan reagera på händelser och visa att man kan skydda data och testa ändringar utan att förstöra innehållet.

---

## Databasens tabeller

### Anvandare

Tabellen **Anvandare** lagrar information om användarna.  
Där sparas användarnamn, e-post och skapadatum.

Jag lade också till ett index på **Epost**.  
Jag gjorde det eftersom sökningar på e-post då kan gå snabbare.

Kort bild i huvudet:  
**Anvandare är personerna i systemet.**

---

### Kategorier

Tabellen **Kategorier** lagrar vilka typer av poster som finns.  
Exempel är dröm, vision, tanke, reflektion och dikt.

Jag valde att ha kategorier i en egen tabell istället för att bara skriva text direkt i Poster.  
Det gör databasen tydligare och mer normaliserad, och det blir enklare att koppla många poster till samma kategori.

Kort metafor:  
**Kategorier är etikettlådan som talar om vad slags text man tittar på.**

---

### Poster

Tabellen **Poster** är kärnan i databasen.  
Det är här själva inläggen sparas.

Där finns koppling till:
- vilken användare som skrivit posten
- vilken kategori posten tillhör
- titel
- innehåll
- synlighet
- skapadatum

Jag valde att ha en kolumn för **Synlighet** med värdena `privat` och `publik`.  
Det gör att man kan visa att en post inte bara har innehåll, utan också ett enkelt statusläge.

Kort metafor:  
**Poster är själva hjärtat i systemet – allt annat kretsar runt dem.**

---

### Begrepp

Tabellen **Begrepp** lagrar ord eller symboler som kan kopplas till poster.  
Exempel är:
- orm
- vatten
- tempel
- svart
- eld
- resa

Varje begrepp har också en beskrivning.  
Tanken är att databasen därigenom kan bära ett litet symbollexikon.

Jag lade till ett index på **Ord** för att sökningar på begrepp ska gå snabbare.

Kort metafor:  
**Begrepp är databasens lilla symbolordbok.**

---

### PostBegrepp

Tabellen **PostBegrepp** är kopplingstabellen mellan **Poster** och **Begrepp**.  
Här sparas:
- vilken post det gäller
- vilket begrepp det gäller

Det finns en `UNIQUE`-regel på kombinationen av post och begrepp.  
Det hindrar att samma begrepp kopplas dubbelt till samma post.

Kort metafor:  
**PostBegrepp är bron mellan texten och symboliken.**

---

### AktivitetLogg

Tabellen **AktivitetLogg** används av triggern.  
När en ny post skapas, loggar databasen automatiskt detta här.

Där sparas:
- vilken post det gäller
- vilken användare det gäller
- vilken händelse som skett
- tidpunkt

Jag valde detta för att visa automation i databasen.  
Det gör att databasen inte bara tar emot data passivt, utan också reagerar när något händer.

Kort metafor:  
**AktivitetLogg är databasens minne av vad som just hände.**

---

## Varför denna databas passar uppgiften

Jag tycker att den här databasen passar uppgiften bra eftersom den innehåller:

- flera tabeller
- tydliga relationer
- både en-till-många och många-till-många
- primärnycklar och främmande nycklar
- index
- trigger
- stored procedure
- JOIN-frågor
- GROUP BY och HAVING
- transaktioner med ROLLBACK
- möjlighet att visa backup/restore

Den är alltså tillräckligt enkel för att gå att förstå, men samtidigt tillräckligt rik för att visa ganska mycket av det vi har arbetat med i kursen.

---

## Relationer i databasen

De viktigaste relationerna är:

- En **användare** kan skriva många **poster**
- En **kategori** kan användas av många **poster**
- En **post** kan ha många **begrepp**
- Ett **begrepp** kan kopplas till många **poster**

Det betyder att databasen innehåller både vanliga en-till-många-relationer och en tydlig många-till-många-relation via **PostBegrepp**.

---

## Trigger

Jag har skapat triggern **trigga_ny_post_logg**.

Den körs automatiskt när en ny rad läggs in i **Poster**.  
Då skapas en loggrad i **AktivitetLogg**.

Jag valde detta eftersom det är ett tydligt exempel på automation i databasen.  
Man ser direkt att databasen reagerar på en händelse.

En enkel förklaring är:  
**När någon skriver något nytt, gör databasen en liten anteckning om att det hände.**

---

## Stored Procedure

Jag har också skapat en lagrad procedur: **hamta_poster_per_kategori**.

Den visar hur många poster som skapats per kategori mellan två datum.

Jag valde denna eftersom den är enkel att förstå men ändå visar att databasen kan sammanställa data på ett återanvändbart sätt.

En enkel bild:  
**Proceduren är som en färdig rapportfråga som databasen redan kan utantill.**

---

## Exempel på frågor databasen kan svara på

Databasen kan till exempel användas för att visa:

- alla användare
- alla kategorier
- alla poster
- en viss användare
- en viss kategori
- ett visst begrepp
- vilka begrepp som finns i en viss post
- vilka användare som har skrivit poster
- vilka poster som hör till en viss kategori
- hur många poster varje användare har
- vilka begrepp som används mest
- vilka användare som har fler än ett visst antal poster

Det gör att databasen går att använda både för lagring och för analys.

---

## Transaktioner och rollback

Jag har också med två exempel på transaktioner med **ROLLBACK**.

Ett exempel visar en uppdatering av en användares e-postadress som sedan ångras.  
Det andra visar en borttagning av data som också ångras.

Jag valde detta för att visa att man kan testa ändringar utan att de måste bli permanenta direkt.

En enkel bild:  
**Transaktion + rollback är som att prova något med blyerts innan man bestämmer sig för att skriva med penna.**

---

## Restoretest

I slutet av SQL-filen skapas också en tom testdatabas för restoretest.

Tanken där är att visa hur man kan förbereda för att kontrollera backup/restore, även om själva återställningen sedan görs separat vid import.

---

## Slutsats

Reflektionsarkiv är en relationsdatabas för att lagra självreflektiva poster och koppla dem till kategorier och begrepp.

Jag valde den här modellen eftersom den:
- är tydlig
- går att förklara
- innehåller riktiga relationer
- visar många delar av SQL och databashantering
- känns mer levande än en helt generisk databas

Jag tycker att styrkan i databasen är att den både visar klassisk relationsdesign och samtidigt har ett mer personligt innehåll än exempelvis en vanlig butik eller bokningstabell.

Kort sagt:  
**det här är en databas där texten är kärnan, relationerna håller ihop allt, och symboliken ger systemet ett extra lager av mening.**