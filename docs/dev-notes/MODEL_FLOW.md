# Modellflöde (Tyda) — kort sanningsrevision

## Källor

- **Statisk allowlist:** `SUPPORTED_MODELS` / `SUPPORTED_MODEL_IDS` i `backend/app/routers/interpret.py`.
- **Runtime-sanning:** `client.models.list()` (OpenAI) via `_fetch_openai_model_ids()`; cache TTL OK 300s / fail 60s.
- **UI-lista:** `GET /api/interpret/status` → `model_options` + `runtime_verification_*`.

## Rotorsak till tidigare “falska” val

UI kunde visa alla fem förkonfigurerade id:n även när leverantörens lista inte kunde hämtas eller när inget id matchade kontot — användaren valde då modeller som anropet ändå misslyckades för.

## Nuvarande beteende (minimal fix)

- Om lista **saknas** eller **ingen** förkonfigurerad modell matchar → endast **en** rad (`DEFAULT_MODEL_ID`), `runtime_available: false`, och `runtime_verification_message` förklarar varför.
- Om lista finns och matchar → bara modeller som `_model_id_runtime_available` godkänner.
- `POST .../interpret`: om lista hämtas och vald modell inte finns i den → **HTTP 400** med explicit `detail` innan OpenAI-anrop.

## Env

- `OPENAI_API_KEY` krävs för tolkning och för runtime-lista.
- `OPENAI_MODEL` (valfri) styr standardval om id finns i `SUPPORTED_MODEL_IDS`.
