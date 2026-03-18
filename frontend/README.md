# Frontend – Tyda

React/Vite-frontend för Reflektionsarkiv.

## Start

Från `frontend/`:

```powershell
npm install
npm run dev
```

Frontend kör normalt på `http://localhost:5173` och proxar API-anrop till backend på port `8000`.

## Viktiga flöden

- Startsidan väljer eller skapar aktiv användare
- `Mitt rum` visar den aktiva användarens privata yta
- `Ny post` hanterar titel, innehåll, kategori, synlighet och lokalt utkast
- `Utforska` visar publika poster
- `Postdetalj` visar begreppsträffar och, om backend är konfigurerad, AI-tolkning
- `Om Tyda` visar den faktiska datamodellen, men markerar också tydligt vad som är schema och vad som i praktiken bara beräknas i backend

## Navigation och användarbyte

- Desktop: toppnavigation
- Mobil/smal vy: drawer via menyknappen
- Aktiv användare lämnas via `Byt användare` i headern på desktop eller i menyn på smalare vyer
- Aktiv profil lagras i browserns localStorage

## Modellval och AI

- Postdetaljen har en modellväljare i AI-panelen
- Frontend hämtar tillåtna modeller via `GET /api/interpret/status`
- Vald modell skickas till `POST /api/posts/{id}/interpret?model=...`
- Om vald modell inte är tillgänglig faller backend tillbaka till standardmodellen eller returnerar ett begripligt fel
- Modellistan innehåller nu `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o`, `gpt-5-mini` och `gpt-5`

## Testbarhet

- Huvudflöden använder stabila routes och tillgängliga labels/placeholders
- Runtime-test för ny-post-flödet finns i `frontend/e2e-runtime/newpost-runtime.spec.ts`
- Enhetstester körs med Vitest

```powershell
npm run build
npm test
```

## Runbook

Den praktiska runbooken som länkas från appen finns i `frontend/public/runbook.md`.
