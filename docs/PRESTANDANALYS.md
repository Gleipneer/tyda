# Prestandaanalys – Reflektionsarkiv

Kort dokumentation av indexanvändning och prestanda för centrala frågor.

## Centrala frågor

1. **Lista poster** – används vid Mitt rum, Mina poster
2. **Begrepp per post** – används vid postdetalj
3. **Mest använda begrepp** – används i analytics

## EXPLAIN-resultat

Kör dessa mot en databas med data för representativa resultat.

### 1. Lista poster (med användare och kategori)

```sql
EXPLAIN SELECT
    p.PostID, p.Titel, p.Innehall, p.Synlighet, p.SkapadDatum,
    a.AnvandarID, a.Anvandarnamn,
    k.KategoriID, k.Namn AS KategoriNamn
FROM Poster p
INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
ORDER BY p.SkapadDatum DESC, p.PostID DESC;
```

**Förväntad indexanvändning:** `idx_poster_anvandare`, `idx_poster_kategori`, `idx_poster_skapaddatum` för sortering. JOIN:s använder primärnycklar och FK-index.

### 2. Begrepp kopplade till en post

```sql
EXPLAIN SELECT pb.PostBegreppID, b.BegreppID, b.Ord, b.Beskrivning
FROM PostBegrepp pb
INNER JOIN Begrepp b ON pb.BegreppID = b.BegreppID
WHERE pb.PostID = 1
ORDER BY b.Ord ASC;
```

**Förväntad indexanvändning:** `postbegrepp_postid_begreppid_unique` (UNIQUE-index) för filtrering på PostID. Begrepp joinas via primärnyckel.

### 3. Mest använda begrepp (analytics)

```sql
EXPLAIN SELECT b.BegreppID, b.Ord, COUNT(pb.PostBegreppID) AS AntalKopplingar
FROM Begrepp b
LEFT JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
GROUP BY b.BegreppID, b.Ord
ORDER BY AntalKopplingar DESC, b.Ord ASC;
```

**Förväntad indexanvändning:** `idx_postbegrepp_begrepp` för JOIN från Begrepp till PostBegrepp på BegreppID.

## Indexstrategi

| Tabell | Index | Syfte |
|--------|-------|-------|
| Poster | idx_poster_anvandare | Filtrera poster per användare |
| Poster | idx_poster_kategori | Filtrera poster per kategori |
| Poster | idx_poster_skapaddatum | Sortering efter datum |
| PostBegrepp | postbegrepp_postid_begreppid_unique | UNIQUE + sökning på PostID |
| PostBegrepp | idx_postbegrepp_begrepp | JOIN/analytics på BegreppID |
| AktivitetLogg | idx_aktivitetlogg_post_tidpunkt | Aktivitet per post |

## Borttaget index

`idx_postbegrepp_post` togs bort i migration 012. UNIQUE(PostID, BegreppID) täcker redan sökningar på PostID (vänsterkolumn). Det extra indexet var redundant och ökade skrivkostnad utan nytta.
