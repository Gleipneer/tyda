# Audit- och implementationsrapport: AI-tolkning, kontrakt, presentation, auth

Datum: 2026-03-20 (kodbas: Tyda / Reflektionsarkiv)

## 1. Nuläge (före denna implementation)

- **Modellval:** `_normalize_model` bytte **tyst** ogiltigt modellnamn mot standard — användaren kunde tro att en annan modell användes än den som faktiskt valdes (metadata speglade bara den normaliserade id:n).
- **OpenAI-svar:** `response.model` från leverantören användes inte; `model_used` speglade bara begäran.
- **Tolkningstyp:** Kontrakt härleddes enbart från **postkategori**; allt som inte var dröm/dikt blev i praktiken samma reflektionskontrakt — ingen explicit användarstyrning.
- **Kontraktssektioner:** Olika id:n per typ; fallback vid JSON-fel upprepade samma mekaniska mening i flera sektioner.
- **Runbook:** Beskrev inloggning utan JWT och påstod att `anvandar_id` skickades från klient vid poster — **fel** mot nuvarande backend.
- **Lösenord:** Redan **bcrypt** via passlib (`security.py`) — inget behov av ny hash-algoritm; dokumentation behövde stämma med verkligheten.

## 2. AI-modellager

- **UI-lista:** Hämtas från `GET /interpret/status`. Om OpenAI `models.list` lyckas filtreras listan till modeller som matchar (exakt id eller prefix som `gpt-4o-…`). Om listan är tom eller anrop misslyckas visas alla konfigurerade modeller med `runtime_verification_message`.
- **Ogiltigt namn:** HTTP **400** med lista över tillåtna id:n — ingen tyst fallback.
- **Metadata i svar:** `requested_model` (null om standard), `used_model` och `model_used` (samma som leverantörens `response.model`), `fallback_used` / `fallback_reason` om id skiljer sig från beställt, `provider: "openai"`.
- **Filer:** `backend/app/routers/interpret.py`, `backend/app/schemas/interpret.py`, `frontend/src/services/interpret.ts`, `PostDetailPage.tsx`.

## 3. Tolkningstyp

- Användaren väljer **tolkningstyp** i AI-panelen; postens kategori sätter bara **förval** (synkat per post, kan överstyras).
- API: `POST .../interpret` med JSON `{ "model"?, "interpret_kind"? }`; `?model=` stöds fortfarande.
- Backend: `_resolve_interpret_contract(interpret_kind, KategoriNamn)` — explicit kind slår kategori.
- **Filer:** `interpretationContracts.ts`, `interpret.py` (CONTRACTS för åtta typer).

## 4. Tolkningskontrakt

- Åtta typer: `dream`, `poem`, `reflection`, `text_excerpt`, `symbol_focus`, `event_experience`, `relation_situation`, `free`.
- Gemensam **sexdelad** ordning: kort läsning → bärande element → inre rörelse → teman → öppen fråga → försiktighet.
- Systemprompt förankrar **inre liv** och förbjuder tvärsäkra formuleringar; intern arbetsordning 1–6 enligt spec.

## 5. Presentationslager och validering

- `_structure_ai_response` fyller saknade sektioner med **olika** mjuka texter; `contract_degraded` sätts vid saknade delar eller JSON-fel.
- Borttagen upprepning av *«Modellen svarade inte helt enligt kontraktet…»*.
- Frontend: luftigare sektioner, tydlig metadata-rad, diskret varning vid `fallback_used` och `contract_degraded`.

## 6. Auth / lösenord

- **Metod:** bcrypt (passlib), rundor 12 — **salt ingår** i den lagrade strängen i `LosenordHash`.
- **Filer oförändrade i logik:** `backend/app/security.py`; tester tillagda i `backend/tests/test_auth_passwords.py`.
- **Dokumentation:** Runbook + Om Tyda uppdaterade kring JWT och bcrypt.

## 7. Tester

- `backend/tests/test_interpret_contracts.py` — kontrakt, modellval, struktur, ingen tyst fallback.
- `backend/tests/test_auth_passwords.py` — hash/verify, olika salt.
- `frontend/src/lib/interpretationContracts.test.ts` — kategori→kind och etiketter.
- Övriga pytest (`test_database_truth`, `test_dromtolkning_precision`) kan kräva specifik DB/data — kör i miljö med migrerad databas.

## 8. Kvarstående risker

- **OpenAI `models.list`** kan skilja sig åt mellan konton; prefix-matchning är heuristik.
- **Leverantörens modell-id** kan skilja sig från begärd sträng utan att innehållet «bytt modell» i användarterms — då flaggas `fallback_used`.
- **Ingen migration** av gamla lösenord behövs om allt redan är bcrypt; om legacy-data finns måste det inventeras separat i databasen.

## 9. Exempel före / efter (konceptuellt)

**Före:** Kategori «tanke» + ogiltig modell `gpt-3.5-turbo` → tyst byte till mini; samma reflektionsmall som dikt om kategori inte matchade; upprepad fallbackmening i flera rutor.

**Efter:** Explicit tolkningstyp «Reflektion eller tanke» eller «Fri tolkning»; ogiltig modell → tydligt 400; svar i sex lugna avsnitt med varsamt språk; metadata visar begärd/ använd modell och om svaret kompletterats.

## Agentsvärm

Se `docs/AGENTSVARM_AI_TOLKNING.md` för arbetsfördelning.
