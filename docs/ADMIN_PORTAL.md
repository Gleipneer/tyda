# Adminportal och behörighet (Tyda / Reflektionsarkiv)

## Roller

| Roll | Lagring | Rättigheter |
|------|---------|-------------|
| **Vanlig användare** | `Anvandare.ArAdmin = 0` | CRUD på **egna** poster, läsa publikt lexikon, aktivitet/analys för **eget** innehåll |
| **Administratör** | `Anvandare.ArAdmin = 1` | Allt ovan + adminportal + alla poster + användarlista/skapande + CRUD på **begrepp** |

Backend läser `ArAdmin` från databasen vid varje anrop med giltig JWT (inte bara från token-payload).

## Inloggning

1. `POST /api/auth/login` → `{ access_token, token_type, user }`
2. Klienten sparar `access_token` (localStorage `tyda.accessToken`) och skickar `Authorization: Bearer <token>` på skyddade anrop.
3. `GET /api/auth/me` validerar token och returnerar färsk användardata (inkl. `ar_admin`).

Registrering: `POST /api/users` returnerar samma token+user så att användaren blir inloggad direkt.

## Adminportal (frontend)

| Route | Innehåll |
|-------|----------|
| `/admin` | Statistik: antal användare, poster, begrepp |
| `/admin/anvandare` | Tabell över användare, formulär för ny användare (lösenord hashas med bcrypt i backend) |
| `/admin/poster` | Alla poster, öppna + radera (med bekräftelse) |
| `/admin/begrepp` | Lista/sök, skapa, redigera (modal), radera (bekräftelse; CASCADE på PostBegrepp) |

Icke-admin som försöker öppna `/admin` redirectas till `/mitt-rum`. Menyn **Admin** visas bara om `user.ar_admin`.

## Viktiga API-endpoints (ändrade eller nya)

### Auth

- `POST /api/auth/login` → `TokenResponse`
- `GET /api/auth/me` — kräver Bearer

### Användare

- `POST /api/users` — registrering → `TokenResponse`
- `GET /api/users/{id}` — kräver inloggning; endast **själv** eller **admin**

### Admin (alla kräver admin-JWT)

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `POST /api/admin/users` — body: `anvandarnamn`, `epost`, `losenord`, `ar_admin`
- `GET /api/admin/posts`

### Poster

- `GET /api/posts` — kräver JWT; icke-admin ser bara **egna** poster; admin ser alla (valfria query `anvandar_id`, `synlighet`)
- `GET /api/posts/{id}` — publik post utan inloggning; privat kräver ägare eller admin
- `POST /api/posts` — kräver JWT; **ingen** `anvandar_id` i body (ägare = token)
- `PUT/DELETE /api/posts/{id}` — ägare eller admin

### Begrepp

- `GET /api/concepts` — fortfarande publikt
- `POST/PUT/DELETE /api/concepts` — **endast admin**

### Övrigt

- `GET /api/activity` — icke-admin: logg för egna poster; admin: hela loggen
- `GET /api/analytics/*` — icke-admin: data begränsad till egen användare
- `POST /api/posts/{id}/interpret` — privat post kräver ägare/admin + Bearer

## Första admin i databasen

Sätt `ArAdmin = 1` för valt konto i `Anvandare`, eller skapa admin via SQL i `reflektionsarkiv.sql` / befintligt demo-konto (se `docs/INLOGGNING_DEMO.md`).

## Miljövariabler

Se `backend/.env.example`: `JWT_SECRET` (obligatoriskt att byta i produktion), `JWT_EXPIRE_HOURS`.

## Manuella testscenarier

1. Registrera användare, skapa post (ska lyckas med token).
2. Försök anropa `GET /api/posts` utan `Authorization` → 401.
3. Som user A: notera ID för user B:s **privata** post; `DELETE /api/posts/{id}` med A:s token → 403.
4. Som ägare: `DELETE` egen post → 200.
5. Logga in som admin: `GET /api/admin/users` → 200; som vanlig användare → 403.
6. Admin: skapa begrepp, redigera, radera via UI eller API.
7. Icke-admin: `POST /api/concepts` → 403.
