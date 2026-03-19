import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { Database, ArrowRight, Layers, Zap } from "lucide-react";

const tables = [
  {
    name: "Anvandare",
    description: "Här finns användarna som kan skapa poster i systemet.",
    fields: "AnvandarID, Anvandarnamn, Epost, SkapadDatum",
  },
  {
    name: "Kategorier",
    description: "Här finns posttyperna, till exempel dröm, tanke, reflektion och dikt.",
    fields: "KategoriID, Namn, Beskrivning",
  },
  {
    name: "Poster",
    description: "Själva huvudtabellen. Varje post hör till en användare och en kategori.",
    fields: "PostID, AnvandarID, KategoriID, Titel VARCHAR(150), Innehall, Synlighet ENUM('privat','publik'), SkapadDatum",
  },
  {
    name: "Begrepp",
    description: "Symbollexikonet som backend matchar mot när text analyseras.",
    fields: "BegreppID, Ord, Beskrivning, SkapadDatum",
  },
  {
    name: "PostBegrepp",
    description: "Kopplingstabellen mellan poster och begrepp (många-till-många). UNIQUE(PostID, BegreppID).",
    fields: "PostBegreppID, PostID, BegreppID",
  },
  {
    name: "AktivitetLogg",
    description: "En enkel teknisk loggtabell. Idag skrivs en rad när en ny post skapas. Det är inte en full historik över alla ändringar.",
    fields: "LoggID, PostID, AnvandarID, Handelse, Tidpunkt",
  },
];

const relations = [
  { from: "Anvandare", to: "Poster", label: "1 användare kan ha många poster" },
  { from: "Kategorier", to: "Poster", label: "1 kategori kan ha många poster" },
  { from: "Poster", to: "PostBegrepp", label: "1 post kan ha många begreppskopplingar" },
  { from: "Begrepp", to: "PostBegrepp", label: "1 begrepp kan finnas i många poster" },
  { from: "Poster", to: "AktivitetLogg", label: "1:N — FK PostID i SQL (ON DELETE CASCADE). Streckad i diagram = loggrad skapas av trigger." },
  { from: "Anvandare", to: "AktivitetLogg", label: "1:N — FK AnvandarID i SQL. Streckad i diagram = samma loggsemantik som ovan." },
  { from: "Kategorier", to: "AktivitetLogg", label: "Streckad linje i diagrammet endast: ingen KategoriID i AktivitetLogg; koppling sker via Poster." },
];

const queryExamples = [
  {
    title: "Hämta alla poster med användare och kategori",
    source: "Används i systemet",
    description: "Här används INNER JOIN för att koppla ihop poster med både användare och kategori. Det är det som driver listvyn för poster.",
    sql: `SELECT
    p.PostID, p.Titel, p.Innehall, p.Synlighet, p.SkapadDatum,
    a.AnvandarID, a.Anvandarnamn,
    k.KategoriID, k.Namn AS KategoriNamn
FROM Poster p
INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
ORDER BY p.SkapadDatum DESC, p.PostID DESC;`,
  },
  {
    title: "Hämta en viss post",
    source: "Används i systemet",
    description: "Här används WHERE för att bara läsa en post. Samtidigt hämtas användare och kategori med JOIN.",
    sql: `SELECT
    p.PostID, p.Titel, p.Innehall, p.Synlighet, p.SkapadDatum,
    a.AnvandarID, a.Anvandarnamn,
    k.KategoriID, k.Namn AS KategoriNamn
FROM Poster p
INNER JOIN Anvandare a ON p.AnvandarID = a.AnvandarID
INNER JOIN Kategorier k ON p.KategoriID = k.KategoriID
WHERE p.PostID = %s;`,
  },
  {
    title: "Hämta begrepp kopplade till en post",
    source: "Används i systemet",
    description: "Här läser systemet de begrepp som faktiskt är sparade i kopplingstabellen PostBegrepp.",
    sql: `SELECT
    pb.PostBegreppID,
    b.BegreppID, b.Ord, b.Beskrivning
FROM PostBegrepp pb
INNER JOIN Begrepp b ON pb.BegreppID = b.BegreppID
WHERE pb.PostID = %s
ORDER BY b.Ord ASC;`,
  },
  {
    title: "Visa aktivitet för en post",
    source: "Backend-route finns",
    description: "Det här är den tekniska frågan för aktivitet per post. Nuvarande frontend visar i stället en enklare aktivitetsfeed för användarens poster.",
    sql: `SELECT LoggID, PostID, AnvandarID, Handelse, Tidpunkt
FROM AktivitetLogg
WHERE PostID = %s
ORDER BY Tidpunkt DESC, LoggID DESC;`,
  },
  {
    title: "Räkna antal poster per kategori",
    source: "Tekniskt exempel / backendanalytics",
    description: "Frågan är rimlig mot schemat och liknar backendanalytics, men den nuvarande frontendens analysvy räknar främst från användarens egna poster client-side.",
    sql: `SELECT
    k.KategoriID,
    k.Namn AS Kategori,
    COUNT(p.PostID) AS AntalPoster
FROM Kategorier k
LEFT JOIN Poster p ON k.KategoriID = p.KategoriID
GROUP BY k.KategoriID, k.Namn
ORDER BY AntalPoster DESC, k.Namn ASC;`,
  },
  {
    title: "Räkna vanligaste begrepp",
    source: "Tekniskt exempel / backendanalytics",
    description: "Här räknas manuellt sparade kopplingar i PostBegrepp. Automatisk textmatchning syns i UI:t men sparas inte här.",
    sql: `SELECT
    b.BegreppID,
    b.Ord,
    COUNT(pb.PostBegreppID) AS AntalKopplingar
FROM Begrepp b
LEFT JOIN PostBegrepp pb ON b.BegreppID = pb.BegreppID
GROUP BY b.BegreppID, b.Ord
ORDER BY AntalKopplingar DESC, b.Ord ASC;`,
  },
  {
    title: "Filtrera med WHERE",
    source: "Visas som exempel för att förklara databasen",
    description: "Ett enkelt exempel på filtrering. Här visas bara kategorin drom.",
    sql: `SELECT *
FROM Kategorier
WHERE Namn = 'drom';`,
  },
  {
    title: "Sortera med ORDER BY",
    source: "Visas som exempel för att förklara databasen",
    description: "Här sorteras posterna så att de senaste kommer först.",
    sql: `SELECT *
FROM Poster
ORDER BY SkapadDatum DESC;`,
  },
  {
    title: "Skapa en ny post",
    source: "Används i systemet",
    description: "Det här är INSERT-frågan som används när en ny post sparas från frontend.",
    sql: `INSERT INTO Poster (AnvandarID, KategoriID, Titel, Innehall, Synlighet)
VALUES (%s, %s, %s, %s, %s);`,
  },
  {
    title: "UPDATE i en transaktion",
    source: "Visas som exempel för att förklara databasen",
    description: "Här visas att en ändring kan provas och sedan ångras med ROLLBACK. Det är bra att kunna förklara vid redovisning.",
    sql: `START TRANSACTION;
UPDATE Anvandare
SET Epost = 'joakim.nyepost@example.com'
WHERE AnvandarID = 1;
ROLLBACK;`,
  },
  {
    title: "Lagrad procedur: poster per kategori mellan två datum",
    source: "Visas som exempel för att förklara databasen",
    description: "I SQL-filen finns också en lagrad procedur. Den visar att databasen kan kapsla in en återanvänd fråga med parametrar.",
    sql: `CALL hamta_poster_per_kategori('2024-01-01', '2026-12-31');`,
  },
];

export default function AboutDatabasePage() {
  return (
    <AppLayout>
      <PageHeader
        title="Om Tyda"
        description="Den här sidan visar databasen så som den faktiskt ser ut och används just nu: liten modell, tydliga relationer och ett mellanlager som gör den tyngre intelligensen."
      />

      <ContentCard padding="lg" className="mb-6">
        <h2 className="text-xl font-display font-semibold text-foreground mb-3">Det viktigaste först</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Databasen är medvetet liten: 6 tabeller, 1 trigger och 1 lagrad procedur. Tyngre matchning och AI-logik ligger i backend, inte i schemat.
          </p>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            ER-diagrammet visar tabellerna och relationerna. Kolumner och typer står under &quot;Tabeller&quot; nedan. `PostBegrepp` är den verkliga många-till-många-tabellen; automatisk begreppsmatchning räknas i backend och sparas inte där.
          </p>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            `AktivitetLogg` är idag en enkel skapelselogg för poster, inte en full auditlogg över allt som händer i systemet.
          </p>
        </div>
      </ContentCard>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-6 mb-8">
        <ContentCard>
          <h2 className="text-lg font-display font-semibold text-foreground mb-3">ER-diagram</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <svg viewBox="0 0 840 360" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {/* Workbench-liknande: bara tabellnamn i rutor (kolumner finns under Tabeller nedan) */}
                <g className="stroke-primary">
                  <rect x="24" y="40" width="176" height="44" rx="8" className="fill-accent" strokeWidth="1.5" />
                  <text x="112" y="68" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 600 }}>Anvandare</text>

                  <rect x="24" y="132" width="176" height="44" rx="8" className="fill-accent" strokeWidth="1.5" />
                  <text x="112" y="160" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 600 }}>Kategorier</text>

                  <rect x="302" y="72" width="220" height="48" rx="8" className="fill-sage-light" strokeWidth="2" />
                  <text x="412" y="102" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", fontWeight: 600 }}>Poster</text>

                  <rect x="622" y="40" width="176" height="44" rx="8" className="fill-accent" strokeWidth="1.5" />
                  <text x="710" y="68" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 600 }}>Begrepp</text>

                  <rect x="582" y="188" width="220" height="44" rx="8" className="fill-warm stroke-warm-dark" strokeWidth="1.5" />
                  <text x="692" y="216" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 600 }}>PostBegrepp</text>

                  <rect x="302" y="268" width="220" height="44" rx="8" className="fill-accent" strokeWidth="1.5" />
                  <text x="412" y="296" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px", fontWeight: 600 }}>AktivitetLogg</text>
                </g>

                {/* 1:N heldragen: FK i schemat */}
                <line x1="200" y1="62" x2="302" y2="96" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#er-arrow)" />
                <line x1="200" y1="154" x2="302" y2="104" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#er-arrow)" />
                <line x1="522" y1="96" x2="582" y2="210" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#er-arrow)" />
                <line x1="710" y1="84" x2="692" y2="188" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#er-arrow)" />

                {/* Streckat = loggsemantik (FK PostID/AnvandarID finns i SQL; kategori→logg bara logisk) */}
                <line x1="412" y1="120" x2="412" y2="268" className="stroke-primary" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#er-arrow)" />
                <path
                  d="M 112 84 L 112 248 L 302 248 L 302 268"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  markerEnd="url(#er-arrow)"
                />
                <path
                  d="M 112 176 L 112 258 L 302 258 L 302 268"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  markerEnd="url(#er-arrow)"
                />

                <defs>
                  <marker id="er-arrow" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-primary" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground font-body leading-relaxed">
            <p>
              <strong className="text-foreground/90">Heldragen linje</strong> = 1:N med främmande nyckel i <span className="font-mono">reflektionsarkiv.sql</span> (t.ex. Poster→Anvandare/Kategorier, PostBegrepp→Poster/Begrepp).
            </p>
            <p>
              <strong className="text-foreground/90">Streckad linje till AktivitetLogg</strong> = samma 1:N som i SQL finns som FK på <span className="font-mono">PostID</span> och <span className="font-mono">AnvandarID</span>, men vi ritar streckat för att markera <em>loggtabell</em> där nya rader normalt sätts in av triggern <span className="font-mono">trigga_ny_post_logg</span>. Linjen från <span className="font-mono">Kategorier</span> är <em>inte</em> en egen FK — kategori når loggen bara genom posten.
            </p>
            <p>`Poster.Synlighet` har databasvärdena `privat`, `publik`.</p>
            <p>
              När en post tas bort rensas rader i <span className="font-mono">PostBegrepp</span> och <span className="font-mono">AktivitetLogg</span> via <span className="font-mono">ON DELETE CASCADE</span> i SQL — inte bara något appkoden råkar göra.
            </p>
          </div>
        </ContentCard>

        <ContentCard>
          <h2 className="text-lg font-display font-semibold text-foreground mb-3">Det viktiga att förstå</h2>
          <div className="space-y-4 text-sm font-body text-muted-foreground">
            <p>
              ER-diagrammet visar schemat. Triggern är inte en egen tabell, utan logiken som fyller `AktivitetLogg` när en ny rad skapas i `Poster`.
            </p>
            <p>
              Automatisk begreppsmatchning lagras inte direkt i databasen. Den räknas fram i backend när text analyseras. Bara manuella kopplingar sparas i `PostBegrepp`.
            </p>
            <p>
              AI-tolkningen läser postens text, de automatiskt matchade begreppen och de manuellt kopplade begreppen. Själva AI-svaret sparas inte i databasen.
            </p>
            <p>
              `AktivitetLogg` ska läsas som en enkel poster-logg. Uppdateringar, automatchning och AI-generering skrivs inte hit i dagens implementation.
            </p>
          </div>
        </ContentCard>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Tabeller</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tables.map((table) => (
            <ContentCard key={table.name}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="text-base font-display font-medium text-foreground">{table.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">{table.description}</p>
              <p className="text-xs text-muted-foreground/80 font-mono break-words">{table.fields}</p>
            </ContentCard>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Relationer</h2>
        <ContentCard>
          <div className="space-y-3">
            {relations.map((relation) => (
              <div key={`${relation.from}-${relation.to}`} className="flex items-center gap-3 text-sm font-body">
                <span className="font-medium text-foreground px-2 py-1 bg-accent rounded">{relation.from}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground px-2 py-1 bg-accent rounded">{relation.to}</span>
                <span className="text-muted-foreground ml-auto text-xs">{relation.label}</span>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Hur en post blir till</h2>
          </div>
          <ContentCard>
            <ol className="space-y-3 text-sm font-body text-foreground">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">1</span>
                <span>Du skriver titel och innehåll, väljer kategori och bestämmer synlighet. I UI:t står det Privat eller Publik; i databasen sparas värden som `privat`, `publik`.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">2</span>
                <span>Posten sparas i `Poster` och kopplas med främmande nycklar till `Anvandare` och `Kategorier`.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">3</span>
                <span>Databasens trigger skriver en rad i `AktivitetLogg` när posten skapas. Det gör loggen till en enkel skapelselogg, inte en full historik över allt som händer senare.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">4</span>
                <span>Om du kopplar begrepp manuellt senare sparas de i `PostBegrepp`. Automatisk matchning förblir ett beräknat underlag.</span>
              </li>
            </ol>
          </ContentCard>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Hur begrepp och AI används</h2>
          </div>
          <ContentCard>
            <div className="space-y-4 text-sm font-body">
              <div>
                <h4 className="font-medium text-foreground mb-1">Automatisk matchning</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Backend analyserar texten mot `Begrepp` och visar träffar i gränssnittet. De träffarna är underlag, inte sparade relationer.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Manuella kopplingar</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Det som du själv väljer att koppla till en post sparas i `PostBegrepp`. Det är den faktiska många-till-många-relationen i databasen.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">AI-tolkning</h4>
                <p className="text-muted-foreground leading-relaxed">
                  AI får texten från posten plus begreppsunderlaget. Den använder alltså databasen som källa, men AI-svaret blir en separat reflektion ovanpå datan och sparas inte tillbaka i databasen.
                </p>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">SQL-frågor som systemet bygger på</h2>
        <p className="mb-4 text-sm text-muted-foreground font-body max-w-3xl leading-relaxed">
          Här är de viktigaste querytyperna i projektet. Vissa används direkt av backend. Andra är sanningsbundna SQL-exempel från modellen, men driver inte nödvändigtvis den nuvarande frontendvyn exakt som de står här.
        </p>
        <div className="space-y-4">
          {queryExamples.map((example) => (
            <details key={example.title} className="rounded-2xl border border-border/70 bg-card/96 px-5 py-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-2 pr-6">
                  <h3 className="text-base font-display font-medium text-foreground">{example.title}</h3>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-accent rounded-full">{example.source}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground font-body leading-relaxed">{example.description}</p>
              </summary>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-muted/60 p-4 text-xs leading-relaxed text-foreground">
                <code>{example.sql}</code>
              </pre>
            </details>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
