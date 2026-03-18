# API_PLAN.md
## API-endpoints – Reflektionsarkiv

Alla endpoints under `/api`. JSON request/response.

---

## Health (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/health | Backend igång |
| GET | /api/db-health | Databasanslutning OK |

---

## Users (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/users | Lista användare |
| GET | /api/users/{id} | En användare |
| POST | /api/users | Skapa användare |

---

## Categories (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/categories | Lista kategorier |
| GET | /api/categories/{id} | En kategori |

---

## Posts (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/posts | Lista poster (med användare, kategori) |
| GET | /api/posts/{id} | Post i detalj |
| POST | /api/posts | Skapa post |
| PUT | /api/posts/{id} | Uppdatera post |
| DELETE | /api/posts/{id} | Ta bort post (transaktion) |

---

## Concepts (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/concepts | Lista begrepp |
| GET | /api/concepts/{id} | Ett begrepp |
| POST | /api/concepts | Skapa begrepp |
| PUT | /api/concepts/{id} | Uppdatera begrepp |
| DELETE | /api/concepts/{id} | Ta bort begrepp |
| GET | /api/posts/{id}/concepts | Begrepp kopplade till post |
| POST | /api/posts/{id}/concepts | Koppla begrepp till post |
| DELETE | /api/post-concepts/{id} | Ta bort koppling |

---

## Activity (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/activity | Hela loggen |
| GET | /api/activity/post/{id} | Logg för en post |

---

## Analytics (MVP)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| GET | /api/analytics/posts-per-category | Poster per kategori |
| GET | /api/analytics/posts-per-user | Poster per användare |
| GET | /api/analytics/most-used-concepts | Mest använda begrepp |

---

## Analyze (automatisk symbolmatchning)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| POST | /api/analyze/text-concepts | Matcha ord i text mot Begrepp (deterministisk) |
| GET | /api/posts/{id}/matched-concepts | Automatchade begrepp för en post |

---

## Interpret (AI-tolkning, valfritt)
| Metod | Path | Beskrivning |
|-------|------|-------------|
| POST | /api/posts/{id}/interpret | Generera kort AI-tolkning (kräver OPENAI_API_KEY) |
| GET | /api/interpret/status | Kontrollera om AI-tolkning är tillgänglig |

---

## Tabellmappning (kort)

- Users → Anvandare
- Categories → Kategorier
- Posts → Poster (+ JOIN Anvandare, Kategorier)
- Concepts → Begrepp, PostBegrepp
- Activity → AktivitetLogg
- Analytics → GROUP BY / LEFT JOIN
