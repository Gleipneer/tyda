# Salvia frontend-uppgradering – sammanfattning

**Datum:** 2025-03-15

---

## 1. Hur salvia-temat byggdes

Ett **design token-system** infördes i `frontend/src/styles/salvia-tokens.css` med CSS-variabler:

| Token | Värde | Användning |
|-------|-------|------------|
| `--salvia-primary` | #4F6B5A | Primär salvia |
| `--salvia-sidebar` | #3F5648 | Mörkare sidebar |
| `--salvia-active` | #6F8A78 | Aktiv meny, hover |
| `--salvia-highlight` | #DCE8E0 | Ljus highlight |
| `--salvia-accent` | #7C9A6D | Mossgrön accent |
| `--salvia-bg` | #F6F4EF | Varm off-white bakgrund |
| `--salvia-card` | #FFFDF9 | Kort-yta |
| `--salvia-border` | #D8DDD4 | Mjuk border |
| `--salvia-text` | #1F2A24 | Primär text |
| `--salvia-text-secondary` | #5B675F | Sekundär text |
| `--salvia-badge` | #ECE9E2 | Badge/tag-bakgrund |
| `--salvia-badge-accent` | #DCE8E0 | Begrepp-tags |

---

## 2. Uppdaterade delar

### Design tokens
- `frontend/src/styles/salvia-tokens.css` – ny fil med alla färgvariabler

### Globala stilar
- `frontend/src/index.css` – importerar tokens, body/bakgrund, länkar, rubriker

### Layout & navigation
- `frontend/src/components/Layout.css` – salvia-bakgrund
- `frontend/src/components/Sidebar.tsx` – ikoner, salvia-färger, tydligare aktiv state
- `frontend/src/components/Sidebar.css` – mörk salvia, hover/active
- `frontend/src/components/PageLayout.tsx` – ny komponent för sidor med högerspalt
- `frontend/src/components/PageLayout.css`

### Poster-sidan
- `frontend/src/pages/PostsPage.tsx` – statistikrad, högerspalt, PageLayout
- `frontend/src/pages/PostsPage.css` – stat-kort, knappar
- `frontend/src/components/PostList.css` – salvia-färger
- `frontend/src/components/PostCard.tsx` – kategori-badge
- `frontend/src/components/PostCard.css` – kort med salvia
- `frontend/src/components/BegreppAside.tsx` – ny högerspalt "Begrepp i fokus"
- `frontend/src/components/BegreppAside.css`

### Ny post / skrivvy
- `frontend/src/pages/NewPostPage.tsx` – editor-card, tydligare header
- `frontend/src/pages/NewPostPage.css`
- `frontend/src/components/PostForm.tsx` – editor-first: titel + innehåll först, metadata i rad
- `frontend/src/components/PostForm.css` – formulärfält med salvia focus, placeholders

### Post-detaljsidan
- `frontend/src/pages/PostDetailPage.css` – sektioner, kort, salvia

### Begrepp
- `frontend/src/components/MatchedConcepts.css` – begreppskort med salvia
- `frontend/src/pages/ConceptsPage.tsx` – kortlayout istället för lista
- `frontend/src/pages/ConceptsPage.css` – begreppskort i grid

### Övriga sidor
- `frontend/src/pages/DashboardPage.css` – stat-kort, recent-list
- `frontend/src/pages/AnalyticsPage.tsx` + `.css` – tabeller med salvia
- `frontend/src/pages/ActivityPage.tsx` + `.css` – tabell med salvia
- `frontend/src/components/ConceptPicker.css` – salvia-knappar och fält

---

## 3. Design tokens / variabler

Ja. Alla färger går via CSS-variabler i `:root`. Inga hårdkodade hex-värden i komponenterna. Det gör det enkelt att justera paletten på ett ställe.

---

## 4. Omkalibrerade komponenter

| Komponent | Ändringar |
|----------|-----------|
| Sidebar | Mörk salvia, ikoner, tydlig aktiv state |
| Knappar | Primär = salvia, hover = mörkare salvia |
| Formulärfält | Salvia border, focus ring, placeholders |
| Kort | Varmvit bakgrund, mjuk border, salvia shadow |
| Badges/tags | Salvia-accent, diskret |
| Tabeller | Salvia-badge header, border |
| Begreppskort | Salvia-card, expand/collapse |

---

## 5. Referensidéer från bilderna

- **Bild 1:** Vänsternavigation (mörk, ikoner, aktiv markering), kortlayout för poster, statistikrad, högerspalt "Begrepp i fokus"
- **Bild 2:** Tydlig page header, editor-first skrivvy, begreppsarkiv som kortgrid, dashboard med stat-kort

---

## 6. Screenshots

Kör appen och ta skärmdumpor:

```bash
# Terminal 1 – backend
cd backend && python -m uvicorn app.main:app --reload

# Terminal 2 – frontend
cd frontend && npm run dev
```

Öppna http://localhost:5173 och ta screenshots på:

1. **Poster** – `/posts`
2. **Ny post** – `/posts/new`
3. **Post-detalj** – `/posts/1` (eller annat id)
4. **Begrepp** – `/concepts`

---

## 7. Vad som känns bättre i UI:t

- **Lugnare:** Salvia-palett istället för blått
- **Tydligare hierarki:** Page headers, statistikrad, sektioner
- **Mer fokus på skrivande:** Editor-first formulär, större textarea
- **Begrepp i fokus:** Högerspalt på poster-sidan
- **Begreppssidan:** Kortgrid istället för platt lista
- **Formulär:** Tydligare fokus, placeholders, salvia-färger
- **Konsistens:** Samma tokens i alla komponenter

---

## 8. Återstående för stark frontend

- **Ikoner i sidebar:** Enkla inline-SVG finns; ev. utbyte mot ikonbibliotek
- **Begrepp-tags på postkort:** Kräver API-anrop per post; kan läggas till senare
- **Responsivitet:** PageLayout har media query för små skärmar; kan finjusteras
- **Tillgänglighet:** Fokus-states är satta; ev. ytterligare ARIA och kontrastkontroll
