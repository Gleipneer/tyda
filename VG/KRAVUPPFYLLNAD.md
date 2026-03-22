# Jämförelse mot projektkrav

Här väger jag uppgiften i databaskursens kravspecifikation (`YH_26_planering_databaser (1).pdf`) mot vad vi har byggt i detta repo (Tyda).

## G-nivå (Grundkrav)
- **Minst tre sammanlänkade tabeller:** Uppfyllt. Databasen har faktiskt 6 tabeller (Anvandare, Kategorier, Poster, Begrepp, PostBegrepp, AktivitetLogg), länkade med främmande nycklar.
- **Implementerat i RDBMS:** Uppfyllt. Lösningen är byggd i MySQL.
- **Primär- och främmande nycklar:** Uppfyllt. Vi använder det överallt där en relation existerar (tex mellan användare och post, eller i många-till-många-tabellen `PostBegrepp`).
- **Constraints för dataintegritet:** Uppfyllt. Vi använder `NOT NULL`, begränsningar via `CHECK` (inga tomma titlar), `DEFAULT`-värden (för tid och synlighet), `FOREIGN KEY` och `ENUM` för att skydda dataintegriteten.
- **Trigger:** Uppfyllt. Två stycken (`trigga_ny_post_logg` och `trigga_post_uppdaterad_logg`) automatiserar infogningar till vår loggtabell.
- **JOIN och GROUP BY:** Uppfyllt. Dessa används skarpt i koden, t.ex. när poster hämtas med sin ägare och kategori, eller när vi räknar kopplingar per begrepp.
- **Skriftlig reflektion:** Uppfyllt, men flyttat! Vi har valt att bygga in reflektionen direkt i frontend under vyn "Om Tyda", där man visuellt kan se ER-diagram och motiveringar ihop med live-SQL. README hålls istället kort.

## VG-nivå (Utökade krav)
- **Val av modell (SQL vs NoSQL):** Uppfyllt. Vi motiverar i "Om Tyda" varför en relationsdatabas valdes. Datan har skarpa relationer (användare -> inlägg -> kopplingstabell -> begrepp mm) där en SQL-lösning eliminerar redundans och erbjuder starka constraint-garantier. NoSQL är sämre anpassat för detta relaterade format.
- **Lagrad procedur:** Uppfyllt. Proceduren `hamta_poster_per_kategori` finns och genererar en rapport för ett utvalt tidsspann.
- **Säkerhetsstrategi:** Uppfyllt. Vi tillämpar "least privilege". Frontend drivs av backend, och backend pratar med databasen via ett eget begränsat konto (`reflektionsarkiv_app` eller dylikt) som inte får ändra tabellscheman, löst via GRANT/REVOKE i skript. Dessutom lagras alla lösenord hashat med bcrypt.
- **Prestanda och optimering:** Uppfyllt. Vi har planerat index (ex. index på `AnvandarID`, `KategoriID` och tidpunktsfält) där databasen oftast hämtar, filtrerar och grupperar data för att garantera kort svarstid.
- **System som interagerar:** Uppfyllt. Det är inte bara en databas utan ett fullt system med frontend och backend som körs integrerat med databasen. All logik kommunicerar med SQL-lagret.

Sammanfattningsvis klickar projektet i samtliga boxar för G och VG, och bjuder på ett extra lager med grafiskt gränssnitt som interagerar direkt med och redovisar databasens SQL.
