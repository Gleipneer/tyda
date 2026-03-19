# Reflektionsarkiv – Databasen

**Joakim Emilsson – YH24**  
Allt här bygger på `reflektionsarkiv.sql`.

---

## Vad är det här?

En liten relationsdatabas för att spara drömmar, tankar och reflektioner. Den bär grunddatan, medan symbolmatchning och AI-tolkning ligger i mellanlagret. 6 tabeller, en trigger och en lagrad procedur.

---

## Tabell för tabell

**Anvandare** – Vem som skriver. Namn, e-post, **LosenordHash** (bcrypt), **ArAdmin** (0/1). Inloggning i appen verifierar mot hash; se `docs/INLOGGNING_DEMO.md`.

**Kategorier** – Typ av post: dröm, vision, tanke, reflektion, dikt.

**Poster** – Själva inlägget. Titel, text, synlighet (privat eller publik). Varje post tillhör en användare och en kategori. CHECK säkerställer att titel inte är tom.

**Begrepp** – Ord som kan kopplas till poster (orm, vatten, tempel, eld…). Ett litet symbollexikon.

**PostBegrepp** – Kopplingstabellen. En post kan ha många begrepp, ett begrepp kan finnas i många poster.

**AktivitetLogg** – En enkel loggtabell. I dagens implementation skriver triggern en rad här när en post skapas. Det är inte en full revisionshistorik.

---

## Så hänger det ihop

- 1 användare → många poster
- 1 kategori → många poster
- 1 post → många postbegrepp
- 1 begrepp → många postbegrepp
- Poster och Begrepp har alltså många-till-många via PostBegrepp

---

## Varför PostBegrepp?

Utan den skulle vi inte kunna koppla flera begrepp till en post. PostBegrepp är bron.

---

## Flödet

1. Du skapar en post
2. Kategori och synlighet sparas i `Poster`
3. Triggern skriver en skapelsehändelse i `AktivitetLogg`
4. Om du senare kopplar begrepp manuellt sparas de i `PostBegrepp`

---

## Till läraren

6 tabeller, tydliga relationer. Kopplingstabell för många-till-många. Trigger vid ny post. Lagrad procedur. Databasen är liten men tillräcklig, medan tyngre intelligens ligger i backend. Lätt att förklara muntligt utan att överdriva vad loggen eller AI-lagret gör.
