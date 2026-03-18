# FRONTEND_PLAN.md
## Frontendplan – Reflektionsarkiv

---

## 1. Sidor som finns nu

| Sida | Syfte | Data |
|------|------|------|
| Start | Välj eller skapa aktiv användare | GET /api/users, POST /api/users |
| Mitt rum | Privat översikt för aktiv användare | GET /api/posts |
| Utforska | Publika poster | GET /api/posts/public, GET /api/categories |
| Mina poster | Lista den aktiva användarens poster | GET /api/posts |
| Ny post | Skapa post med kategori och synlighet | GET /api/categories, POST /api/posts, POST /api/analyze/text-concepts |
| Postdetalj | Läs post, begrepp och AI-tolkning | GET /api/posts/{id}, GET /api/posts/{id}/concepts, GET /api/posts/{id}/matched-concepts, POST /api/posts/{id}/interpret |
| Begrepp | Läs symbollexikonet | GET /api/concepts |
| Analys | Enkel statistik för aktiv användare | GET /api/posts, GET /api/posts/{id}/concepts |
| Aktivitet | Aktivitet kopplad till aktiv användare | GET /api/activity + GET /api/posts |
| Om Tyda | Produkt-/databasförklaring | Statisk sida i frontend |

---

## 2. Komponenter

**Layout:** `AppLayout`, `PageHeader`, `ContentCard`

**Post:** skrivyta, förhandspanel för begrepp, postkort, postdetalj

**Concepts:** lexikonlista, `Begrepp i fokus`, manuellt kopplade begrepp på postdetalj

**Analytics:** översiktskort och enklare sammanställningar per kategori/begrepp

**Activity:** aktivitetslista för det egna rummet

---

## 3. Design

- Lugn, ljus och lågmäld visuell ton
- Mobile-first layout: samma informationsstruktur ska fungera i smal vy först
- Diskreta accenter, tydliga kort och rundade ytor
- Viktiga lägen ska vara begripliga även utan att användaren känner databasen

---

## 4. Navigation just nu

- Desktop: toppnavigation i headern
- Mobil/smal vy: drawer via menyknappen
- Med aktiv användare: `Mitt rum`, `Ny post`, `Utforska`, `Mina poster`
- Sekundärt: `Begrepp`, `Aktivitet`, `Analys`, `Om Tyda`
- Aktiv användare kan lämnas via `Byt användare` i headern på desktop eller i menyn på smalare vyer
- `Runbook` är länkad lågmält från appskalet som statisk markdown-fil

---

## 5. Skrivflöde och kategori

- `Ny post` kräver titel och innehåll
- Kategori väljs i samma skrivflöde och hämtas från backend
- Synlighet väljs i UI:t som `Privat` eller `Offentlig`; i datamodellen finns värdena `privat`, `delad`, `publik`
- Utkast sparas lokalt per aktiv användare
- Mobil prioriterar skrivytan först; stödytan kommer direkt efter och desktop utökar samma ordning
- Stödytan visar automatchade begrepp medan användaren skriver
- Efter spara skickas användaren till postdetaljen

---

## 6. AI-tolkning och modellval

- AI-tolkning triggas från postdetaljen
- Frontend visar bara om funktionen är tillgänglig; API-nyckeln stannar i backend
- UI:t har modellväljare i AI-panelen på postdetaljen
- Tillåtna modeller hämtas från `GET /api/interpret/status`
- Vald modell skickas till interpret-endpointen och fallback hanteras i backend
- Modellvalet använder nu `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o`, `gpt-5-mini` och `gpt-5`
- Tolkningskontrakt skiljer nu mellan dröm, dikt och reflektion

---

## 7. Testbarhet

- Huvudflöden använder stabila routes och tydliga labels/placeholders
- Mobilmenyn har `aria-labels` för öppna/stäng/navigering
- Ny-post-flödet har runtime-verifiering i `frontend/e2e-runtime/newpost-runtime.spec.ts`
- HTML5-validering används för tom titel/tomt innehåll
- Dokumentationen ska utgå från det som faktiskt går att testa nu, inte från framtida test-id:n

---

## 8. Tomma lägen och felhantering

- Loading states
- Tydliga felmeddelanden
- 404, 400, 500 hanteras
- Ingen aktiv användare skickas tillbaka till startsidan
- Om backend inte svarar ska användaren få ett begripligt UI-läge, inte en tyst tom vy
