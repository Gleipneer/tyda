DU SKA NU ARBETA MOT PROJEKTET I DENNA REPO MED `planering.md` I ROOT SOM PRIMÄR STYRANDE KÄLLA.

VIKTIGT:
- Du ska först läsa `planering.md` i root noggrant.
- Du ska behandla den som den nuvarande masterplanen för projektet.
- Du ska INTE börja koda direkt.
- Du ska först skapa en egen dokumenterad plan under docs/ som visar hur du avser att genomföra projektet från 0 till fungerande system.
- Därefter ska du använda samma interna specialistteam / agentsvärm för att implementera enligt den plan du själv har skapat.
- Allt arbete ska vara sanningsbundet, minimera gissningar och hela tiden hållas nära den faktiska databasen och projektets verkliga struktur.

==================================================
ÖVERGRIPANDE UPPDRAG
==================================================

Projektet är ett reflektionsarkiv ovanpå en redan existerande relationsdatabas.

Du ska:
1. läsa `planering.md`
2. skapa en intern specialist-swarm under huven
3. låta swarmen analysera projektet ur flera perspektiv
4. skriva en egen docs-plan för hur bygget ska genomföras
5. använda samma swarm för att sedan implementera projektet stegvis
6. verifiera allt längs vägen

Du ska alltså först skapa STRUKTUR och PLAN, sedan KOD.

==================================================
AGENTSVÄRM / INTERNT TEAM SOM SKA ANVÄNDAS
==================================================

Arbeta internt som följande specialistteam. Dessa roller ska användas både i planeringsfasen och i kodfasen:

1. SYSTEMARKITEKT
Ansvar:
- total struktur
- lagerindelning
- tydlig separation mellan frontend, backend och databas
- minimera onödig komplexitet
- hålla projektet i rätt scope

2. DATABASARKITEKT
Ansvar:
- säkerställa att all backend-logik mappar korrekt till den verkliga databasen
- FK/PK, relationer, constraints och queries måste vara korrekt förstådda
- inga antaganden som bryter mot existerande schema

3. PYTHON-BACKENDARKITEKT
Ansvar:
- bygga ett tydligt FastAPI-lager ovanpå databasen
- skriva tydliga endpoints
- hålla SQL och databaslogik förklarbar
- minimera “magi”

4. FRONTENDARKITEKT
Ansvar:
- bygga ett lugnt, tydligt och funktionellt gränssnitt
- se till att frontend stödjer databasens verkliga struktur
- inga UI-val som döljer systemets logik

5. UX/PRODUKTDESIGNER
Ansvar:
- hålla användarflöden begripliga
- se till att systemet känns som ett reflektionsarkiv, inte som ett AI-trick
- hålla interaktionen enkel och tydlig

6. QA / TESTANSVARIG
Ansvar:
- definiera verifieringspunkter för varje fas
- säkerställa att varje endpoint och varje UI-del faktiskt fungerar
- kontrollera edge cases, tomma lägen och vanliga fel

7. DOKUMENTATIONSANSVARIG
Ansvar:
- skapa docs som är användbara för fortsatt utveckling
- uppdatera plan, struktur och status
- skriva så att projektägaren kan förstå varför valen gjorts

==================================================
ARBETSREGLER
==================================================

Du ska följa dessa regler strikt:

- Börja INTE med implementation.
- Läs först `planering.md` i root.
- Skapa därefter en egen docs-plan som bygger vidare på den, men gärna förbättrar operativ tydlighet.
- Du ska inte skriva fluff. Endast konkret och användbar dokumentation.
- Du ska inte bygga bonusfunktioner innan kärnflödet är definierat.
- Du ska inte ändra databasschema utan mycket god anledning.
- Du ska inte hitta på funktioner som inte kan härledas från databasen eller planeringen.
- Du ska arbeta stegvis och verifiera varje steg.
- All kod du senare skriver ska vara kommenterad och pedagogisk.

==================================================
FAS 1 – ANALYS OCH DOKUMENTATION
==================================================

Din första uppgift är att skapa en dokumentstruktur under `docs/` som visar hur projektet ska byggas.

Skapa minst dessa filer:

1. `docs/PROJECT_PLAN.md`
Innehåll:
- kort beskrivning av projektet
- teknisk stack
- kärnfunktioner
- avgränsningar
- arkitekturöversikt
- vad som byggs först, sedan, sist
- vad som är MVP och vad som är bonus

2. `docs/ARCHITECTURE.md`
Innehåll:
- systemarkitektur
- lagerindelning
- frontend/backend/databas
- dataflöden
- vilka tabeller som används och hur de exponeras i API
- hur trigger/stored procedure/activity-logg passar in

3. `docs/API_PLAN.md`
Innehåll:
- endpoints som ska byggas
- request/response-format på hög nivå
- vilka tabeller varje endpoint använder
- vilka endpoints som är MVP och vilka som är senare fas

4. `docs/FRONTEND_PLAN.md`
Innehåll:
- vilka sidor som ska finnas
- vilka komponenter som behövs
- hur UI ska se ut och upplevas
- vilka data varje sida behöver
- navigation
- tomma lägen, fel, loading-states

5. `docs/BUILD_ORDER.md`
Innehåll:
- exakt byggordning i faser
- varje fas ska ha:
  - mål
  - filer
  - endpoints
  - verifieringskrav
  - done-definition

6. `docs/STATUS.md`
Innehåll:
- nuvarande status
- vad som är planerat
- vad som återstår
- uppdateras under arbetets gång

VIKTIGT:
- Dessa docs ska inte vara generiska.
- De ska vara direkt anpassade till detta projekt.
- De ska vara så konkreta att samma specialistteam sedan kan börja koda utifrån dem utan att improvisera.

==================================================
KRAV PÅ DOKUMENTFASEN
==================================================

När dokumentfasen är klar ska följande vara sant:

- Det ska vara tydligt vilka sidor som ska byggas
- Det ska vara tydligt vilka API-endpoints som ska byggas
- Det ska vara tydligt vilka tabeller som används var
- Det ska vara tydligt vilken stack som används
- Det ska vara tydligt vilken fasordning som gäller
- Det ska vara tydligt hur verifiering ska ske

När du är klar med dokumentfasen:
- sammanfatta kort vad du skapade
- ange vilka docs som nu är den operativa sanningskällan för implementationen

==================================================
FAS 2 – IMPLEMENTATION MED SAMMA SWARM
==================================================

När docs-fasen är klar ska du använda SAMMA interna specialistteam för att implementera.

Implementationen ska följa:
- `planering.md` i root
- dina nya docs under `docs/`
- den verkliga databasen
- verifieringskraven du själv definierat

Implementationen ska ske i små steg.

==================================================
REKOMMENDERAD IMPLEMENTATIONSORDNING
==================================================

När du kommer till kodfasen ska du använda ungefär denna ordning, om inte docs-fasen visar ett bättre konkret upplägg:

1. Backend bootstrap
- FastAPI app
- config
- db connection
- `/api/health`
- `/api/db-health`

2. Basdata
- users endpoints
- categories endpoints
- posts GET list/detail

3. Frontend bootstrap
- app shell
- navigation
- posts page med riktig data

4. Create post
- backend POST /posts
- frontend form
- verifiera att trigger/logg skapas i databasen

5. Concepts/Begrepp
- concepts endpoints
- post-concept linking
- visa begrepp på detaljsidan

6. Activity log
- visa aktivitetsloggen i UI

7. Analytics
- poster per kategori
- poster per användare
- mest använda begrepp

8. Polish
- felhantering
- loading
- empty states
- UI-förbättringar

9. Bonus endast om kärnan är klar
- text match mot begrepp
- eventuell enkel highlight-logik

==================================================
IMPLEMENTATIONSREGLER
==================================================

- Bygg en fas i taget
- Testa varje fas innan nästa
- Dokumentera i `docs/STATUS.md`
- Kommentera kod pedagogiskt
- Håll SQL och queries begripliga
- Inga onödiga beroenden
- Ingen scope drift
- Inga “smarta” lager som gör systemet svårare att förstå

==================================================
VAD DU SKA GÖRA NU
==================================================

Steg 1:
- Läs `planering.md` i root

Steg 2:
- Skapa docs-strukturen ovan

Steg 3:
- Fyll docs med konkret projektanpassad planering

Steg 4:
- Sammanfatta kort vad du skapade och vilken fil som nu är huvudstyrande för implementationen

Steg 5:
- Förbered sedan implementationen enligt din egen plan

VIKTIGT SLUTKRAV:
Du ska använda samma interna specialist-swarm både för planeringsfasen och för kodfasen.  
Planen du skriver nu ska alltså vara den struktur du själv sedan kodar efter.

Börja nu med dokumentfasen.