# SYMBOL_MATCHING_PLAN.md
## Automatisk symbolmatchning – arkitektur och plan

**Skapad:** 2025-03-15  
**Princip:** Databasen enkel, mellanlagret smart.  
**Se även:** docs/ARCHITECTURE_PRINCIPLES.md

---

## 1. Arkitekturbeslut

**Val: Alternativ A – Enkel databas + smart mellanlager**

- Begrepp-tabellen behålls oförändrad (Ord, Beskrivning, SkapadDatum)
- **Inga nya tabeller, relationer eller schemaändringar**
- All normaliserings-, variant-, synonym- och matchningslogik ligger i Python
- Begrepp fylls på med rikare Beskrivning (flera tolkningsspår i samma fält)

**Motivering:** Databasen förblir lätt att förklara muntligt. Komplexiteten i språkhantering och matchning hör hemma i applikationslagret.

---

## 2. Tolkningsramar

Beskrivningar i Begrepp modellerar flera perspektiv utan att påstå objektiv sanning:

- **Klassisk/antik:** Artemidoros Oneirocritica, etablerad drömtradition
- **Jungianskt:** Symbolpsykologi, arketyper, kollektivt omedvetet
- **Allmän symbolik:** Mytologisk och kulturell symboltradition

Format i Beskrivning: "Klassisk: X. Jungianskt: Y. Symbolik: Z." – eller liknande tydlig uppdelning.

---

## 3. Mellanlager – funktioner (symbol_matcher.py)

| Funktion | Beskrivning |
|----------|-------------|
| Normalisering | Lowercase, ta bort diakritiska tecken för matchning |
| Tokenisering | Dela text i ord (regex på ordgränser) |
| böjningsformer | ormar→orm, vattnet→vatten, askan→aska, svärta→svart |
| Suffixavlägsnande | Svenska: -en, -et, -ar, -or, -er, -na, -t, -n |
| Synonymmappning | drömmar→dröm, mörk→mörker, mor→moder |
| Relaterade ord | sot→eld, våg→hav, bränna→eld; kluster: eld, vatten, hav, ljus, mörker, orm |
| Scoring | Exakt 100, böjning 90, synonym 80, relaterad 60 |
| Prioritering | Sortering efter score, bästa träff per begrepp |
| Return | begrepp_id, ord, beskrivning, matched_token, match_type, score |

**Determinism:** Regelbaserat, inga stokastiska modeller. Samma text ger samma resultat.

---

## 4. Källhierarki för symbolik

1. Primära källor (t.ex. Artemidoros, Jung)
2. Seriösa sekundärkällor med akademisk bakgrund
3. Undvik lösa "drömlexikon" som primär källa
4. Vid osäkerhet: formulera som tolkningsspår, inte sanning

---

## 5. API

- **POST /api/analyze/text-concepts** – befintlig, utökas
- **GET /api/posts/{id}/matched-concepts** – automatchade begrepp för en post (ny)
- Vid POST /api/posts: optional auto-match och return av träffar

---

## 6. Frontend

- Visa automatchade begrepp på post-detalj och i skrivvy
- "Begrepp i fokus" – tydlig sektion med träffar, beskrivningar och matchtyp
- Visar vilket ord som triggade träffen (matched_token) när det skiljer från grundformen
- Manuell koppling kvar som sekundärt stöd

---

## 7. Databas vs mellanlager

| Databas (Begrepp) | Mellanlager (Python) |
|-------------------|----------------------|
| Ord, Beskrivning | Normalisering, böjningsformer |
| Kunskapskälla | Synonymmappning, relaterade ord |
| Enkel att förklara | Scoring, prioritering, matchlogik |
