# Agentsvärm – översikt (Tyda / Reflektionsarkiv)

Arbete kan köras parallellt i dessa spår:

| Spår | Innehåll |
|------|----------|
| **A1** | Modellkontrakt: ingen tyst fallback; `requested_model` / `used_model` / `fallback_*` / `provider`; runtime-verifiering mot OpenAI `models.list` där möjligt |
| **A2** | `interpret_kind` i API + UI; standard från postkategori om användaren inte väljer |
| **A3** | Tolkningskontrakt (inre liv, varsamt språk, enhetlig sektionsordning) |
| **A4** | Normalisering av modelloutput, `contract_degraded`, läsbar presentation |
| **A5** | Auth-dokumentation (bcrypt + JWT); ingen ändring om redan korrekt |
| **A6** | Pytest: kontrakt, modellval, struktur |
| **A7** | `Om Tyda`, `runbook.md` |

Verifiering: `pytest`, `npm run build`, manuellt: olika modeller och tolkningstyper på postdetalj.
