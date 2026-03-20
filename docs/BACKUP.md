# Säkerhetskopia (backup) – Reflektionsarkiv

## Rekommenderat: mysqldump

Använd `mysqldump` för en deterministisk SQL-export av databasen `reflektionsarkiv`.

### Windows (PowerShell)

Från projektroten:

```powershell
.\database\scripts\backup.ps1
```

Skriptet skriver till `backups\reflektionsarkiv_YYYYMMDD_HHMMSS.sql` (katalogen skapas vid behov).

**Miljövariabler (valfritt):**

| Variabel | Standard | Beskrivning |
|----------|----------|-------------|
| `MYSQL_USER` | `root` | MySQL-användare med läsrättigheter |
| `MYSQL_PWD` | *(tom)* | Lösenord (sätts i sessionen av skriptet om angivet) |
| `MYSQL_HOST` | `127.0.0.1` | Värd |
| `MYSQL_PORT` | `3306` | Port |
| `BACKUP_DIR` | `backups` (relativt repo-roten) | Utkatalog |

Exempel med explicit användare:

```powershell
$env:MYSQL_USER = "root"
$env:MYSQL_PWD = "din-hemlighet"
.\database\scripts\backup.ps1
```

### Manuellt (en rad)

```bash
mysqldump -h 127.0.0.1 -P 3306 -u root -p --single-transaction --routines --triggers --default-character-set=utf8mb4 reflektionsarkiv > backup.sql
```

- `--single-transaction`: konsekvent dump vid InnoDB utan låsning av skrivningar under exporten.
- `--routines --triggers`: inkluderar lagrade procedurer och triggers (viktigt för detta projekt).

## Återställning

```bash
mysql -u root -p reflektionsarkiv < backups\reflektionsarkiv_....sql
```

Eller skapa tom databas först om filen innehåller `DROP DATABASE` / `CREATE DATABASE` (som i `reflektionsarkiv.sql`).

## Vad som *inte* ingår i mysqldump

- Applikationsfiler, `.env`, frontend-byggen.
- För full repo-backup: använd versionshantering (git) + separat databasdump.

## Validering

1. Kör `.\database\scripts\backup.ps1` och kontrollera att en `.sql`-fil skapas.
2. Öppna filen och verifiera att den innehåller `CREATE TRIGGER` för `trigga_ny_post_logg` och `trigga_post_uppdaterad_logg`.
