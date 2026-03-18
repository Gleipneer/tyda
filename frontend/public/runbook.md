# Runbook – Tyda

Praktisk guide för att starta, använda och manuellt testa systemet som det fungerar nu.

## 1. Starta systemet

Från projektroten:

```powershell
.\scripts\start.ps1
```

Det startar backend på `http://127.0.0.1:8000` och frontend på `http://localhost:5173`.

Snabb kontroll:

- Öppna `http://localhost:5173`
- Kontrollera att startsidan för `Tyda` visas
- Kontrollera vid behov `http://127.0.0.1:8000/api/health`

## 2. Hitta runt i appen

- Desktop: huvudnavigationen ligger i toppfältet
- Mobil/smal vy: öppna menyn med knappen uppe till höger
- `Mitt rum`: din privata översikt
- `Ny post`: skriv och spara en ny text
- `Utforska`: publika poster
- `Mina poster`: dina sparade poster
- `Begrepp`: lexikonet som matchningen bygger på
- `Aktivitet`: logg för den aktiva användarens poster
- `Analys`: enkel sammanställning per kategori och begrepp
- `Om Tyda`: produkt- och databasförklaring

## 3. Välj användare och lämna aktiv användare

På startsidan kan du:

- skapa en ny lokal användare
- välja en befintlig användare

När en användare är vald skickas du vidare till `Mitt rum`.

För att lämna aktiv användare:

- desktop: klicka `Byt användare` i headern
- mobil/smal vy: öppna menyn och klicka `Byt användare`
- efter utloggning hamnar du på startsidan igen

Viktigt:

- aktiv användare sparas lokalt i webbläsaren
- användarbyte rensar den aktiva profilen i webbläsaren, inte databasen

## 4. Skrivflödet

Gå till `Ny post`.

Fyll i:

- titel
- innehåll
- kategori
- synlighet: `Privat` eller `Offentlig` i UI:t. Datamodellen bakom använder `privat`, `delad`, `publik`

Det som händer medan du skriver:

- utkast sparas lokalt per aktiv användare på den här enheten
- sidopanelen visar automatiskt hittade begrepp medan texten skrivs
- de automatiska träffarna är underlag; de sparas inte som manuella kopplingar av sig själva

När du sparar:

- `privat` stannar i ditt eget rum
- `Offentlig` i UI:t sparas som `publik` och blir synlig i `Utforska`
- du skickas vidare till postens detaljsida

## 5. Vad du ska testa manuellt

### A. Dröm

1. Välj `Ny post`
2. Sätt kategori till `dröm`
3. Skriv till exempel:

```text
Jag drömde om en orm i mörkt vatten. Jag gick mot ett tempel vid stranden.
```

4. Bekräfta att sidopanelen börjar visa ord som `orm`, `vatten`, `tempel` eller liknande
5. Spara posten
6. Kontrollera på detaljsidan:
   - kategori-badge visas
   - `Begrepp i posten` innehåller automatiska träffar
   - AI-panelen går att öppna om backend är konfigurerad med `OPENAI_API_KEY`

### B. Dikt

1. Välj `Ny post`
2. Sätt kategori till `dikt`
3. Skriv en kort dikt, gärna med rad- eller styckebrytningar
4. Spara som `offentlig`
5. Kontrollera:
   - du kommer till detaljsidan efter spara
   - kategorin är `dikt`
   - posten går att hitta i `Utforska`

### C. Reflektion

1. Välj `Ny post`
2. Sätt kategori till `reflektion`
3. Skriv en vardagligare text utan starka symbolord
4. Spara som `privat`
5. Kontrollera:
   - posten syns i `Mitt rum` och `Mina poster`
   - posten syns inte i `Utforska`
   - `Aktivitet` uppdateras efter att posten skapats

## 6. AI-tolkning och modellval

På postdetaljen:

- öppna panelen `AI-tolkning`
- välj modell i fältet `Modell`
- klicka `Generera tolkning`

Tillåtna modeller i nuvarande backend:

- `gpt-4.1-mini`
- `gpt-4.1`
- `gpt-4o`
- `gpt-5-mini`
- `gpt-5`

Så fungerar valet:

- frontend hämtar valbara modeller från `GET /api/interpret/status`
- vald modell skickas till `POST /api/posts/{post_id}/interpret?model=...`
- om modellen inte är tillgänglig används backendens standardmodell eller så visas ett begripligt fel

Byt standardmodell i backend:

1. öppna `backend/.env`
2. sätt `OPENAI_MODEL` till en av de tillåtna modellerna ovan
3. starta om backend

Exempel:

```env
OPENAI_MODEL=gpt-4.1-mini
```

## 7. Testbarhet just nu

Följande är bra att känna till när du testar manuellt eller med Playwright:

- huvudflödena använder stabila routes som `/`, `/mitt-rum`, `/new-post`, `/posts/:id` och `/utforska`
- mobilmenyn har tydliga `aria-labels`
- formuläret för ny post har stabila placeholders och HTML5-validering
- det finns en runtime-spec för ny-post-flödet i `frontend/e2e-runtime/newpost-runtime.spec.ts`

## 8. Kända begränsningar

- aktiv användare och utkast är browser-lokala, så byter du browser eller enhet följer de inte med
- automatiskt hittade begrepp visas som underlag men sparas inte som manuella relationer
- `Aktivitet` visar idag i praktiken skapade poster, inte en full historik över alla ändringar
- publika poster kan läsas i `Utforska`, men AI-tolkning är reserverad för postägaren i det egna rummet
- om backend eller databas inte körs får frontend laddnings- eller felmeddelanden i stället för data
