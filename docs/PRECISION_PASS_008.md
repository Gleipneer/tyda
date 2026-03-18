# Precision-pass 008 – Drömtolkning

**Datum:** 2025-03  
**Syfte:** Förbättra träffsäkerhet och semantik i begreppssystemet utan att bara fylla på ord.

## 1. Ny migration: 008_precision_dromtolkning.sql

### Tillagda begrepp (37 st)

| Grupp | Begrepp |
|-------|---------|
| Drömverb | hitta, leta, försvinna, vakna, somna, skrika, ropa, höra, viska, förlora |
| Hinder/blockering | hinder, låst, låsa, utgång, ingång, återvändsgränd |
| Rumstillstånd | trasig, smal, bred, hal, brant, trång, oändlig |
| Sensorik | ljud, skrik, viskning, tryck, tyngd, beröring, lukt |
| Socialt | ignorera, kalla, rädda, hot, hota |

### Medvetet INTE tillagt i databasen

- Rena böjningsformer (hanteras av VARIANT_TO_BASE)
- Synonymer (hanteras av SYNONYM_TO_BASE)
- Frasmönster (hanteras av PHRASE_RULES)

## 2. Mellanlager – symbol_matcher.py

### Nya varianter (VARIANT_TO_BASE)

Konjugationer för hitta, leta, försvinna, vakna, somna, skrika, ropa, höra, viska, förlora, låsa, trasig, smal, bred, hal, brant, trång, ignorera, kalla, rädda, hota.

### Nya kluster (SYMBOL_CLUSTERS)

- fall: falla, faller, föll, fallit
- fly: flydde, flyr, flugit
- jaga: jagade, jagar, jagat

### Phrase-level regler (PHRASE_RULES)

| Mönster | Begrepp |
|---------|---------|
| kunde inte se | blind |
| kunde inte springa/röra mig/skrika | misslyckas / fastna |
| kom inte fram, hittade inte ut | hinder |
| gick inte att öppna, dörren var låst | låst |
| försökte men gick inte, ville men kunde inte | misslyckas |
| blev dragen, tvingades, hölls fast, fastnade i | dras / fastna |
| föll ner, ramlade ner, sjönk ner, drogs ner | fall / ramla / sjunka / dras |
| tog mig upp, klättrade upp, kom upp | lyfta / klättra / stiga |
| gick igenom, kom in i, kom ut ur, stod utanför | passera / in / ut |
| såg ingenting, allt var tyst, det var dimmigt/suddigt | blind / tystnad / dimma / suddig |
| hörde någon ropa, hörde ett skrik | ropa / skrik |

## 3. AI-underlag

Interpret-endpointen (`POST /api/posts/{id}/interpret`) använder nu:

1. **Post** – titel, kategori, innehåll
2. **Manuellt kopplade begrepp** – användarens val
3. **Begrepp i fokus** – automatchade begrepp (ord + beskrivning + matched_token) från både token- och phrase-matchning

Systemprompten uppdaterad: prioritera begrepp i fokus, använd lexikon som tolkningsramar.

## 4. Testsvit

`backend/tests/test_dromtolkning_precision.py` – 20 realistiska drömformuleringar.

Kör: `cd backend && python -m pytest tests/test_dromtolkning_precision.py -v`

## 5. Verifiering

1. Kör migration: `cd backend && python scripts/run_migration_utf8.py`
2. Kör tester: `python -m pytest tests/test_dromtolkning_precision.py -v`
3. Starta systemet: `.\scripts\start.ps1`
4. Skapa en post med t.ex. "Jag föll ner i mörkt vatten och kunde inte ta mig upp"
5. Klicka "Generera tolkning" – kontrollera att Begrepp i fokus visas med relevanta träffar
