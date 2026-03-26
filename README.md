# Reflektionsarkiv  
Joakim Emilsson – YH25  
Martin Fält – YH25  

Syftet med systemet är att lagra och organisera personliga texter i ett reflektionsarkiv.  
Användaren kan skapa poster, välja kategori, koppla begrepp och se vilka symboler eller ord som automatiskt hittas i texten.  
Systemet innehåller också en valfri AI-funktion som kan ge en möjlig tolkning av en drömtext.

Vi har byggt systemet ovanpå databasen `reflektionsarkiv` och valt att dela upp datan i flera tabeller för att undvika dubbel lagring och få tydliga relationer mellan användare, poster, kategorier, begrepp och loggar.

Projektet består alltså av två delar:

1. **Databasen**, som är själva grunden i uppgiften  
2. **Webbsystemet**, som används för att visa hur databasen fungerar i praktiken  

---

## Systemets huvudfunktion

Systemet är gjort för att en användare ska kunna:

- registrera sig och logga in  
- skapa egna poster  
- välja kategori på posten, till exempel dröm, tanke eller reflektion  
- spara posten som privat eller publik  
- koppla begrepp manuellt till posten  
- få automatiskt hittade begrepp i texten  
- se en möjlig AI-tolkning av en drömtext  

Det betyder att systemet både fungerar som ett arkiv och som en enkel tolkningsmiljö ovanpå databasen.

---

## Databasens tabeller

### Anvandare

Tabellen lagrar information om användare som kan skapa och läsa sina egna poster.

Exempel på attribut:  
`AnvandarID`, `Anvandarnamn`, `Epost`, `LosenordHash`, `ArAdmin`, `SkapadDatum`

---

### Kategorier

Här lagras de kategorier som en post kan tillhöra, till exempel dröm, tanke eller reflektion.

Exempel på attribut:  
`KategoriID`, `Namn`

---

### Poster

Detta är den centrala tabellen i databasen. Här sparas själva innehållet som användaren skriver.

Exempel på attribut:  
`PostID`, `AnvandarID`, `KategoriID`, `Titel`, `Innehall`, `Synlighet`, `SkapadDatum`

En post tillhör en användare och en kategori.

---

### Begrepp

Tabellen lagrar ord och symboler som systemet kan använda som begreppsbibliotek.

Exempel på attribut:  
`BegreppID`, `Ord`, `Beskrivning`

Här finns till exempel symboliska ord som kan användas vid matchning mot text.

---

### PostBegrepp

Detta är en kopplingstabell mellan `Poster` och `Begrepp`.

Den behövs eftersom:

- en post kan ha flera begrepp  
- ett begrepp kan förekomma i flera poster  

Detta är alltså en **många-till-många-relation**.

Exempel på attribut:  
`PostBegreppID`, `PostID`, `BegreppID`

---

### AktivitetLogg

Denna tabell används för att logga vissa händelser i systemet, till exempel när en post skapas eller ändras.

Exempel på attribut:  
`AktivitetID`, `PostID`, `Handelse`, `Tidpunkt`

---

## Relationer

Databasen bygger på tydliga relationer mellan tabellerna.

- En användare kan skapa flera poster  
- En kategori kan användas av flera poster  
- En post kan kopplas till flera begrepp  
- Ett begrepp kan förekomma i flera poster  
- En post kan ha flera logghändelser  

För att lösa relationen mellan poster och begrepp används tabellen `PostBegrepp`.

Detta gör databasen mer normaliserad och tydligare att arbeta med.  
På så sätt undviks onödig dubbel lagring av data.

---

## Funktioner i systemet

Utöver den grundläggande databasstrukturen innehåller projektet flera funktioner.

### Inloggning och användare

Systemet använder inloggning så att varje användare bara arbetar med sina egna poster.  
Detta gör att systemet blir mer realistiskt än en databas där allt är helt öppet.

Lösenord lagras inte i klartext utan som hash.

---

### Skapa och spara poster

En användare kan skriva en titel, ett innehåll, välja kategori och välja om posten ska vara privat eller publik.

Detta visas i frontend, men datan lagras i databasen.

---

### Begrepp och symbolmatchning

Systemet kan koppla begrepp till en post på två sätt:

1. **manuellt**, när användaren själv väljer begrepp  
2. **automatiskt**, när systemet känner igen ord i texten  

Detta gör att en post kan få fler lager av information än bara själva texten.

---

### AI-tolkning av drömmar

Om en post är en drömtext kan användaren få en möjlig AI-tolkning.

Denna funktion är inte själva kärnan i databasuppgiften, men visar hur databasen kan användas tillsammans med ett modernt system ovanpå.

AI-delen ska därför ses som ett extra lager, medan databasen fortfarande är den viktigaste delen i projektet.

---

## Triggers och lagrad procedur

För att uppfylla uppgiftens krav innehåller databasen både triggers och lagrad procedur.

### Triggers

Projektet använder triggers för att automatiskt logga händelser i `AktivitetLogg`.

Exempel:
- när en ny post skapas  
- när en post uppdateras  

Detta gör att databasen själv kan reagera på förändringar, utan att all logik måste ligga i frontend eller backend.

---

### Lagrad procedur

Projektet innehåller också en lagrad procedur som hämtar poster per kategori inom ett visst datumintervall.

Detta visar att viss analyslogik kan ligga direkt i databasen.

---

## Säkerhet

Vi har försökt hålla säkerheten på en rimlig nivå för ett skolprojekt.

### I databasen

- primärnycklar och främmande nycklar används för att hålla relationerna korrekta  
- `NOT NULL`, `UNIQUE` och andra constraints används där det behövs  
- appen ska använda ett begränsat databaskonto i stället för fulla root-rättigheter  

### I systemet

- lösenord lagras som hash  
- JWT används för autentisering  
- skrivoperationer kräver inloggning  
- användaren kan bara arbeta med sina egna poster, medan admin har större rättigheter  

---

## Prestanda och index

För att databasen inte ska bli onödigt långsam har index lagts på kolumner som används ofta vid sökning, filtrering eller relationer.

Exempel på sådana kolumner är:

- användar-id i poster  
- kategori-id i poster  
- datumkolumner  
- begreppskopplingar  
- loggtidpunkter  

Detta gör systemet mer skalbart om mängden poster växer.

---

## Varför vi valde en relationsdatabas

Vi valde MySQL och relationsmodell eftersom datan är tydligt strukturerad.

Systemet består av:

- användare  
- poster  
- kategorier  
- begrepp  
- kopplingar mellan poster och begrepp  
- loggar  

Detta passar mycket bra i en relationsdatabas där man kan använda:

- primärnycklar  
- främmande nycklar  
- JOIN  
- GROUP BY  
- constraints  
- triggers  
- procedurer  

En NoSQL-lösning hade fungerat sämre för just denna uppgift eftersom relationerna mellan datatyperna är viktiga.

---

## Reflektioner

När vi byggde databasen blev det tydligt att det viktigaste inte bara är att få något att fungera, utan att få strukturen att bli tydlig och hållbar.

Det som varit viktigt i detta projekt är bland annat:

- att förstå varför tabellerna måste delas upp  
- att förstå varför många-till-många-relationen mellan poster och begrepp behöver en egen kopplingstabell  
- att hålla databasen normaliserad  
- att tänka på säkerhet och rättigheter  
- att skilja mellan det som hör hemma i databasen och det som hör hemma i systemet ovanpå  

Vi ser därför databasen som själva kärnan i projektet, medan frontend och AI-funktionerna används för att visa hur databasen kan användas i praktiken.

Slutsats

Reflektionsarkiv är ett databassystem där användare kan lagra och organisera texter i olika kategorier.
Systemet använder en relationsdatabas för att hålla ordning på användare, poster, begrepp och loggar.

Det viktigaste i projektet är databasdesignen: tabellerna, relationerna, constraints, triggers, proceduren och säkerheten.
Frontend och AI-tolkning är byggda ovanpå databasen för att göra systemet lättare att visa och förstå i praktiken.

På så sätt blir projektet både ett databassystem och en konkret demonstration av hur databasen fungerar i ett riktigt användarsystem.
---

## Hur systemet körs

Projektet innehåller:

- **backend** i Python / FastAPI  
- **frontend** i React / Vite  
- **databas** i MySQL  

Systemet kan startas med färdiga startskript.

### Windows

```powershell
.\scripts\start.ps1
``` Linux
./scripts/start.sh