import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { Database, ArrowRight, Zap, Layers } from "lucide-react";

const tables = [
  { name: "Anvandare", description: "Lagrar användare med namn och e-post. Varje användare kan skapa många poster.", fields: "AnvandareID, Namn, Epost, SkapadDatum" },
  { name: "Kategorier", description: "Posttyper som dröm, vision, tanke, reflektion och dikt. En kategori kan ha många poster.", fields: "KategoriID, Namn, Beskrivning" },
  { name: "Poster", description: "Kärninnehållet — titel, text och synlighet. Varje post tillhör en användare och en kategori.", fields: "PostID, Titel, Innehall, Synlighet, AnvandareID, KategoriID, SkapadDatum" },
  { name: "Begrepp", description: "Symbollexikonet — ord och arketyper som kan kopplas till poster. Varje begrepp har ett ord och en rik beskrivning.", fields: "BegreppID, Ord, Beskrivning, SkapadDatum" },
  { name: "PostBegrepp", description: "Kopplingstabellen (många-till-många). Binder poster till begrepp med typ och valfri kommentar.", fields: "PostBegreppID, PostID, BegreppID, Typ, Kommentar" },
  { name: "AktivitetLogg", description: "Automatisk logg. Triggern skriver hit varje gång en post skapas.", fields: "LoggID, PostID, AnvandareID, Handling, Tidpunkt" },
];

const relations = [
  { from: "Anvandare", to: "Poster", label: "1 användare → många poster" },
  { from: "Kategorier", to: "Poster", label: "1 kategori → många poster" },
  { from: "Poster", to: "PostBegrepp", label: "1 post → många kopplingar" },
  { from: "Begrepp", to: "PostBegrepp", label: "1 begrepp → många kopplingar" },
  { from: "Poster", to: "AktivitetLogg", label: "Trigger vid INSERT" },
];

export default function AboutDatabasePage() {
  return (
    <AppLayout>
      <PageHeader
        title="Om databasen"
        description="En visuell och pedagogisk genomgång av Reflektionsarkivets databas — 6 tabeller, tydliga relationer, en trigger."
      />

      {/* ER Diagram */}
      <div className="mb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">ER-diagram</h2>
        <ContentCard padding="lg" className="overflow-x-auto">
          <div className="min-w-[600px]">
            <svg viewBox="0 0 800 420" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Anvandare */}
              <rect x="20" y="40" width="160" height="70" rx="8" className="fill-accent stroke-primary" strokeWidth="1.5" />
              <text x="100" y="68" textAnchor="middle" className="fill-foreground text-xs font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px" }}>Anvandare</text>
              <text x="100" y="90" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>AnvandareID, Namn, Epost</text>

              {/* Kategorier */}
              <rect x="20" y="170" width="160" height="70" rx="8" className="fill-accent stroke-primary" strokeWidth="1.5" />
              <text x="100" y="198" textAnchor="middle" className="fill-foreground text-xs font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px" }}>Kategorier</text>
              <text x="100" y="220" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>KategoriID, Namn, Beskrivning</text>

              {/* Poster */}
              <rect x="280" y="100" width="180" height="80" rx="8" className="fill-sage-light stroke-primary" strokeWidth="2" />
              <text x="370" y="132" textAnchor="middle" className="fill-foreground text-xs font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: "14px" }}>Poster</text>
              <text x="370" y="155" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>PostID, Titel, Innehall,</text>
              <text x="370" y="168" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>AnvandareID, KategoriID</text>

              {/* Begrepp */}
              <rect x="600" y="40" width="170" height="70" rx="8" className="fill-accent stroke-primary" strokeWidth="1.5" />
              <text x="685" y="68" textAnchor="middle" className="fill-foreground text-xs font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px" }}>Begrepp</text>
              <text x="685" y="90" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>BegreppID, Ord, Beskrivning</text>

              {/* PostBegrepp */}
              <rect x="560" y="170" width="200" height="70" rx="8" className="fill-warm stroke-warm-dark" strokeWidth="1.5" />
              <text x="660" y="198" textAnchor="middle" className="fill-foreground text-xs font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px" }}>PostBegrepp</text>
              <text x="660" y="220" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>PostID, BegreppID, Typ, Kommentar</text>

              {/* AktivitetLogg */}
              <rect x="280" y="310" width="180" height="70" rx="8" className="fill-accent stroke-primary" strokeWidth="1.5" />
              <text x="370" y="338" textAnchor="middle" className="fill-foreground text-xs font-semibold" style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px" }}>AktivitetLogg</text>
              <text x="370" y="360" textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>LoggID, PostID, Handling, Tidpunkt</text>

              {/* Lines */}
              {/* Anvandare → Poster */}
              <line x1="180" y1="75" x2="280" y2="130" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text x="220" y="95" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "9px" }}>1:N</text>

              {/* Kategorier → Poster */}
              <line x1="180" y1="205" x2="280" y2="155" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text x="220" y="185" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "9px" }}>1:N</text>

              {/* Poster → PostBegrepp */}
              <line x1="460" y1="155" x2="560" y2="195" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text x="510" y="168" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "9px" }}>1:N</text>

              {/* Begrepp → PostBegrepp */}
              <line x1="685" y1="110" x2="660" y2="170" className="stroke-primary" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text x="680" y="145" className="fill-muted-foreground" style={{ fontFamily: "Inter, sans-serif", fontSize: "9px" }}>1:N</text>

              {/* Poster → AktivitetLogg (trigger) */}
              <line x1="370" y1="180" x2="370" y2="310" className="stroke-primary" strokeWidth="1.5" strokeDasharray="6,4" markerEnd="url(#arrow)" />
              <text x="385" y="250" className="fill-primary" style={{ fontFamily: "Inter, sans-serif", fontSize: "9px" }}>TRIGGER</text>

              {/* Arrow marker */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" className="fill-primary" />
                </marker>
              </defs>
            </svg>
          </div>
        </ContentCard>
      </div>

      {/* Tables */}
      <div className="mb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Tabeller</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tables.map((t) => (
            <ContentCard key={t.name}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="text-base font-display font-medium text-foreground">{t.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">{t.description}</p>
              <p className="text-xs text-muted-foreground/70 font-body font-mono">{t.fields}</p>
            </ContentCard>
          ))}
        </div>
      </div>

      {/* Relations */}
      <div className="mb-10">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Relationer</h2>
        <ContentCard>
          <div className="space-y-3">
            {relations.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-body">
                <span className="font-medium text-foreground px-2 py-1 bg-accent rounded">{r.from}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground px-2 py-1 bg-accent rounded">{r.to}</span>
                <span className="text-muted-foreground ml-auto text-xs">{r.label}</span>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      {/* Flow & concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Flöde</h2>
          </div>
          <ContentCard>
            <ol className="space-y-3 text-sm font-body text-foreground">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">1</span>
                <span>Användaren skapar en post med titel, text och kategori</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">2</span>
                <span>Posten sparas i tabellen Poster med FK till Anvandare och Kategorier</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">3</span>
                <span>Begrepp kopplas via PostBegrepp (manuellt eller automatiskt)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">4</span>
                <span>Triggern skriver automatiskt till AktivitetLogg</span>
              </li>
            </ol>
          </ContentCard>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Nyckelkoncept</h2>
          </div>
          <ContentCard>
            <div className="space-y-4 text-sm font-body">
              <div>
                <h4 className="font-medium text-foreground mb-1">Många-till-många</h4>
                <p className="text-muted-foreground leading-relaxed">PostBegrepp är kopplingstabellen som gör att en post kan ha flera begrepp och ett begrepp kan finnas i flera poster.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Trigger</h4>
                <p className="text-muted-foreground leading-relaxed">Vid INSERT i Poster körs en databas-trigger som automatiskt loggar händelsen i AktivitetLogg.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Symbolmatchning</h4>
                <p className="text-muted-foreground leading-relaxed">Python-mellanlagret analyserar text och matchar mot Begrepp-tabellen. Databasen lagrar, mellanlagret tänker.</p>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    </AppLayout>
  );
}
