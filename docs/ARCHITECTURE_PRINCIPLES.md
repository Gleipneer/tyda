# Arkitekturprinciper – Reflektionsarkiv

**Princip:** Databasen enkel, mellanlagret smart. Inga schemaändringar utan extremt starkt skäl.

---

## 1. Databasen hålls enkel

### Vad vi INTE gör
- Inga nya tabeller
- Inga nya relationer
- Inga nya kolumner eller schemaexpansioner

### Vad vi gör
- Fyller på befintliga tabeller med mer innehåll
- Förbättrar kvaliteten på Beskrivning i Begrepp
- Bygger rikare lexikon inom den existerande strukturen

### Begrepp-tabellen
```
BegreppID | Ord | Beskrivning | SkapadDatum
```
All symbolik, tolkningsramar och beskrivningar lagras i `Beskrivning` (TEXT). Format: "Klassisk: X. Jungianskt: Y. Symbolik: Z."

---

## 2. Mellanlagret bär komplexiteten

Python-lagret (`app/services/symbol_matcher.py`) står för:

| Funktion | Beskrivning |
|----------|-------------|
| Normalisering | Lowercase, diakritika, tokenisering |
| böjningsformer | ormar→orm, vattnet→vatten, askan→aska, svärta→svart |
| Variantmatchning | Suffixavlägsnande, manuella mappningar |
| Synonymmappning | Synonymer → grundform i Begrepp |
| Relaterade ord | sot→eld, våg→hav, bränna→eld (via kluster) |
| Klusterlogik | SYMBOL_CLUSTERS: eld, vatten, hav, ljus, mörker, orm |
| Träffdetektion | Automatisk matchning mot Begrepp.Ord |
| Scoring/prioritering | Poäng baserat på matchtyp (exakt, synonym, relaterad) |
| Matchlogik | Tydlig, förklarbar, deterministisk |

**Databasen är kunskapskällan.** Mellanlagret använder databasen, går inte runt den.

---

## 3. Analys: Hur långt kan vi komma utan schemaändring?

### Fullt möjligt utan nya tabeller

| Behov | Lösning utan schemaändring |
|-------|----------------------------|
| Fler begrepp | INSERT i Begrepp (fler rader) |
| Rikare beskrivningar | UPDATE Begrepp.Beskrivning |
| Synonymer | Python-dict: synonym→Ord |
| Relaterade ord | Python-dict: relaterat→Ord |
| böjningsformer | Python: suffixregler + VARIANT_TO_BASE |
| Scoring | Python: beräkna poäng vid matchning |
| Matchlogik | Python: deterministisk pipeline |

### Vad som skulle kräva schemaändring (och vi undviker)

- Separat tabell för synonymer → **Nej**, hanteras i Python
- Separat tabell för relaterade ord → **Nej**, hanteras i Python
- Ny kolumn för "matchtyp" i Begrepp → **Nej**, matchtyp beräknas vid matchning

### Slutsats
Vi kan bygga ett mycket vassare system helt inom befintlig struktur genom att:
1. Fylla Begrepp med fler ord och bättre beskrivningar
2. Placera all matchlogik i Python-mellanlagret

---

## 4. Dataflöde

```
[Användare skriver text]
        ↓
[Frontend: titel + innehåll]
        ↓
[POST /api/analyze/text-concepts] eller [GET /api/posts/{id}/matched-concepts]
        ↓
[Backend: symbol_matcher.find_matches(text, concepts)]
        ↓
[concepts från concept_repo.get_all_concepts() = SELECT * FROM Begrepp]
        ↓
[Python: normalisera, tokenisera, matcha mot Ord + synonymer + relaterade]
        ↓
[JSON: matches med begrepp_id, ord, beskrivning, matched_token, score]
        ↓
[Frontend: MatchedConcepts visar "Begrepp i fokus"]
```

---

## 5. Epistemisk försiktighet

- Beskrivningar är tolkningsramar, inte objektiva sanningar
- Källhierarki: klassisk (Artemidoros m.fl.), jungianskt, allmän symbolik
- Vid osäkerhet: formulera som tolkningsspår

---

## 6. Determinism

- Regelbaserat, inga stokastiska modeller
- Samma text ger samma resultat
- Inga floating versions, ingen hidden state
