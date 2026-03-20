# Databassäkerhet: GRANT, REVOKE, admin och Tyda

Det här dokumentet stödjer VG-kravet om **säkerhetsstrategi** (t.ex. begränsa behörigheter med **GRANT** och **REVOKE**). Det kopplar ihop `database/scripts/grants.sql` med hur du loggar in i MySQL — och skillnaden mot **applikations**roller (JWT, admin i webben).

---

## Två världar: MySQL-admin vs inloggad användare i appen

| Begrepp | Vad det är |
|--------|------------|
| **MySQL root / `reflektionsarkiv_admin`** | Konton mot **själva databasservern**. Används för att skapa tabeller, köra `reflektionsarkiv.sql`, migrationer och `grants.sql`. |
| **`reflektionsarkiv_app`** | Kontot som **backend** bör använda i **produktion** (via `DB_USER` / `DB_PASSWORD` i `.env`). Minimala rättigheter. |
| **`Anvandare` i tabellen Anvandare** | **Applikationens** användare (innehåll i Tyda). Det är **inte** samma sak som MySQL-admin. |

---

## Webbadmin i Tyda vs MySQL-admin

| Vad | Beskrivning |
|-----|-------------|
| **Innehållsadmin i webben** | Tyda har routes under `/admin` för inloggade **administratörer** (`ArAdmin=1`). Det styrs av **JWT + `require_admin`** — se `docs/ADMIN_PORTAL.md`. |
| **MySQL-administration** | Schema, `grants.sql`, migrationer körs med **privilegierat konto** (root / `reflektionsarkiv_admin`). **GRANT/REVOKE** ligger i `database/scripts/grants.sql`. |

**VG:s databassäkerhet** = vad **`reflektionsarkiv_app`** får göra i MySQL (definieras i SQL). **Applikations**admin = vem som får anropa API. Verifiera DB-konto: `GET /api/db-health` → `mysql_connection_as`.

---

## Vad är REVOKE?

**REVOKE** = *ta bort* en eller flera rättigheter från en användare.

- **GRANT** ger t.ex. `SELECT` på en databas.
- **REVOKE** tar tillbaka det som tidigare givits.

I `grants.sql` används:

```sql
REVOKE ALL PRIVILEGES ON reflektionsarkiv.* FROM 'reflektionsarkiv_app'@'localhost';
```

**Varför?** Om du kör skriptet flera ganger, eller om någon tidigare gett app-användaren **för breda** rättigheter, nollställs allt på `reflektionsarkiv.*` först. Sedan sätter vi **bara** det som ska gälla:

- `SELECT, INSERT, UPDATE, DELETE` (DML)
- `EXECUTE` (anropa lagrad procedur i den databasen)

App-användaren får alltså **inte** `CREATE TABLE`, `DROP DATABASE`, `ALTER` m.m. på `reflektionsarkiv` – de ges helt enkelt inte efter `REVOKE ALL` + begränsad `GRANT`.

*(Om du i en redovisning vill nämna REVOKE punkt för punkt: du kan manuellt demonstrera `REVOKE INSERT ON reflektionsarkiv.* FROM 'reflektionsarkiv_app'@'localhost';` och sedan `GRANT INSERT ...` igen – men i drift räcker mönstret ovan.)*

---

## Hur loggar jag in som ”admin” i MySQL?

1. **Root** (vanligast lokalt):
   ```bash
   mysql -u root -p
   ```
   Lösenord: det du satte vid MySQL-installation.

2. **Den valfria databas-administratören** från `grants.sql`:
   ```bash
   mysql -u reflektionsarkiv_admin -p
   ```
   Använd lösenordet du satte istället för `admin_password_placeholder`.

3. **Välj databas** när du jobbar mot Tyda:
   ```sql
   USE reflektionsarkiv;
   ```

**Applikationsanvändaren** (för att testa som appen):
```bash
mysql -u reflektionsarkiv_app -p reflektionsarkiv
```

---

## Körordning i praktiken

1. Skapa databas och schema: `reflektionsarkiv.sql` eller `reset_database.py` (som **root** eller **`reflektionsarkiv_admin`**).
2. Kör migrationer om du använder dem (samma privilegierade konto).
3. Kör **`database/scripts/grants.sql`** som **root** (eller annat konto som får `CREATE USER` / `GRANT`).
4. I **produktion**: sätt `DB_USER=reflektionsarkiv_app` och motsvarande lösenord i `backend/.env`.
5. Verifiera: `GET /api/db-health` ska visa `mysql_connection_as` = `reflektionsarkiv_app@...` när least privilege används.

---

## Sammanhang mot VG-mappen (PDF)

PDF:en i `VG/` (t.ex. planering) beskriver ofta **generella** VG-mål: GRANT/REVOKE, roller, ibland admin-UI i **exempelprojekt**. **Tyda** uppfyller databasdelen med:

- `grants.sql` (app + valfri DB-admin)
- dokumentation här och i `README.md` under *Säkerhetsstrategi*
- `GET /api/db-health` visar vilket MySQL-konto backend använder

Webbaserad **innehållsadmin** finns under `/admin`; den **ersätter inte** GRANT — databasrättigheter för `DB_USER` sätts fortfarande i `grants.sql`.
