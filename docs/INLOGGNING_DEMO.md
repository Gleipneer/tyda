# Demo-inloggning (Tyda)

**Viktigt:** Använd endast lokalt / i utbildning. Byt lösenord och hashar i produktion. Lösenord ska aldrig committas i klartext i kod – de lagras som **bcrypt-hash** i kolumnen `LosenordHash`.

## Förinställda konton (efter `reflektionsarkiv.sql` eller migration 015)

| Roll   | Fält att skriva i appen | Lösenord   | Kommentar |
|--------|---------------------------|------------|-----------|
| Joakim | **E-post:** `emilssonjoakim@gmail.com` | `15Femton` | Vanlig användare (`ArAdmin` = 0) |
| Admin  | **E-post/användarnamn:** `admin` (eller `admin@tyda.local`) | `admin` | Administratör (`ArAdmin` = 1) |
| Anna   | `anna@example.com` | `demo123` | Demo |
| Elias  | `elias@example.com` | `demo123` | Demo |

**Admin:** I inloggningsformuläret kan du skriva bara `admin` som första fält – backend tolkar det som administratörskontot.

## API

- `POST /api/auth/login` med JSON `{"identifier": "...", "password": "..."}`  
- `POST /api/users` skapar konto med `losenord` (minst **8** tecken).

## Säkerhetsnotis

API:t för poster använder fortfarande `anvandar_id` från klienten vid skapande – i en riktig produktion skulle man koppla det till en server-side session eller JWT efter inloggning.
