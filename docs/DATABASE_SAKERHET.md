# Databassäkerhet: GRANT, REVOKE, admin och Tyda

Det här dokumentet stödjer VG-kravet om **säkerhetsstrategi** (t.ex. begränsa behörigheter med **GRANT** och **REVOKE**). Det kopplar ihop `database/scripts/grants.sql` med hur du loggar in i MySQL – och vad som **inte** finns i Tyda.

---

## Två världar: MySQL-admin vs inloggad användare i appen

| Begrepp | Vad det är |
|--------|------------|
| **MySQL root / `reflektionsarkiv_admin`** | Konton mot **själva databasservern**. Används för att skapa tabeller, köra `reflektionsarkiv.sql`, migrationer och `grants.sql`. |
| **`reflektionsarkiv_app`** | Kontot som **backend** bör använda i **produktion** (via `DB_USER` / `DB_PASSWORD` i `.env`). Minimala rättigheter. |
| **`Anvandare` i tabellen Anvandare** | **Applikationens** användare (innehåll i Tyda). Det är **inte** samma sak som MySQL-admin. |

---

## Finns en ”adminportal” i Tyda?

**Nej – inte som i många VG-exempel (t.ex. e-handel med separat admin-UI).**

- I kurs-PDF:er förekommer ofta en **webbaserad adminportal** för att hantera lager, ordrar eller textfält. Det är ett **generellt exempel**, inte något som automatiskt ska finnas i varje projekt.
- I **Tyda** finns **ingen** separat webbplats eller route som heter ”admin” för databasen. Administration av MySQL görs med **mysql-klient**, **MySQL Workbench** eller motsvarande, med **root** eller **`reflektionsarkiv_admin`**.
- Tabellen **`Begrepp`** kan hanteras via befintlig API-/appfunktionalitet där det stöds; det är **applikationsnivå**, inte en dedikerad ”DB-adminportal”.

*(Om VG-dokument kräver visning av **Kommentar TEXT** i admin: den kolumnen finns **inte** längre i `PostBegrepp` – se `VG/VG_ATERSTAENDE.md`.)*

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

---

## Sammanhang mot VG-mappen (PDF)

PDF:en i `VG/` (t.ex. planering) beskriver ofta **generella** VG-mål: GRANT/REVOKE, roller, ibland admin-UI i **exempelprojekt**. **Tyda** uppfyller databasdelen med:

- `grants.sql` (app + valfri DB-admin)
- dokumentation här och i `README.md` under *Säkerhetsstrategi*

Avvikelser (t.ex. ingen webb-adminportal, ingen `Kommentar`-kolumn) är **medvetna designval** och ska kunna motiveras muntligt/skriftligt med hänvisning till `VG/VG_ATERSTAENDE.md`.
