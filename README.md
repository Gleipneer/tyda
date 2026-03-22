# Tyda – Databasprojekt

Tyda är en relationsdatabas (MySQL) för att spara och tolka drömmar, tankar och reflektioner. Detta är slutprojektet i kursen Databaser av Joakim Emilsson och Martin Fält.

## Hur du startar
Starta med skriptet i roten:

**Windows:**
```powershell
.\scripts\start.ps1
```

**Mac/Linux:**
```bash
./scripts/start.sh
```

När allt snurrar hittar du frontend på `http://localhost:5173` och backend på `http://127.0.0.1:8000`.

## Innehåll
- **Databasen (`reflektionsarkiv.sql`)**: 6 tabeller (`Anvandare`, `Kategorier`, `Poster`, `Begrepp`, `PostBegrepp`, `AktivitetLogg`). Den är hjärtat och innehåller relationer, constraints, triggers, index och en lagrad procedur.
- **Frontend / Backend**: Byggt med React och Python (FastAPI). Backenden utnyttjar en dedikerad databasanvändare med begränsade rättigheter (least privilege) för säkerhet.
- **Om Tyda**: Inne i webbappen finns en vy ("Om Tyda") som fungerar som djupgående dokumentation. Där ser du ER-diagram, alla realtids-SQL-frågor och motiveringar till designen. Allt rörande databasstrukturen hittar du där, snarare än i denna fil.
