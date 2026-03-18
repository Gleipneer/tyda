# LEXICON_EXPANSION_PLAN.md
## Plan för lexikonutbyggnad

**Mål:** Minst 250 högkvalitativa grundbegrepp.  
**Princip:** Databasen enkel; innehållet berikas.

---

## 1. Kategorier (migration 003)

| Kategori | Exempel |
|----------|---------|
| Element/Natur | regn, is, vind, gryning, skymning, dimma, stjärna, källa |
| Djur | häst, varg, björn, uggla, korp, spindel, fjäril, delfin |
| Platser | rum, källare, port, mur, stad, öken, grotta, torn |
| Objekt | svärd, bok, lampa, båt, säng, klocka, mask, kors |
| Människor | främling, vän, kung, drottning, vägvisare, skugga |
| Processer | fall, uppstigning, förlust, återkomst, sökande, vila |
| Färger/Kvaliteter | guld, silver, blek, kall, varm, tom, full |
| Symboltunga motiv | vattenfall, labyrint, cirkel, centrum, frö, rot |

---

## 2. Genomfört (2025-03-15)

- **257 begrepp** i databasen (migration 003_lexicon_250)
- Rikare beskrivningar med Klassisk/Jungianskt/Symbolik
- Källmedveten formulering (se docs/SOURCE_STRATEGY.md)

---

## 3. Framtida utbyggnad

- Ytterligare begrepp inom befintliga kategorier
- Fler böjningsformer och synonymer i symbol_matcher
- Eventuella nya kluster vid behov

**Inga schemaändringar** – endast INSERT/UPDATE i Begrepp.
