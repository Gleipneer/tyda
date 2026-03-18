import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";
import { Sparkles, BookOpen, Brain, ChevronDown, ChevronUp } from "lucide-react";

const postData = {
  id: 1,
  title: "Drömmen om templet vid havet",
  category: "Dröm",
  author: "Joakim Emilsson",
  date: "14 mars 2026",
  visibility: "Privat",
  content: `Jag stod vid ett tempel som reste sig ur havet. Vattnet var stilla men djupt, och himlen ovanför hade en kopparfärgad ton som jag aldrig sett förut.

Templet var byggt av vit sten, med pelare som verkade växa upp ur klipporna. Det fanns inga dörrar — bara öppningar som ledde in i ett mörker som inte kändes hotfullt, utan inbjudande.

Jag gick in. Inuti hörde jag vatten droppa, långsamt och rytmiskt. Väggarna var täckta av symboler jag inte kunde läsa, men som jag kände att jag förstod. Det var som ett språk som talade direkt till kroppen.

I mitten av rummet stod en orm, hoprullad, med huvudet lyft. Den betraktade mig utan aggression, som om den väntade. Jag kände ingen rädsla — bara en djup, stilla nyfikenhet.`,
  manualConcepts: [
    { name: "tempel", type: "manual" as const, comment: "Centralt i drömmen" },
    { name: "hav", type: "manual" as const, comment: "Omgivande element" },
  ],
  matchedConcepts: [
    { name: "vatten", type: "exact" as const, description: "Klassisk: reningens och livets element. Jungianskt: det omedvetna, känslolivets djup." },
    { name: "tempel", type: "exact" as const, description: "Klassisk: helig plats, kontakt med det gudomliga. Jungianskt: Självet, den inre helheten." },
    { name: "orm", type: "exact" as const, description: "Klassisk: visdom, förnyelse, transformation. Jungianskt: instinkternas energi, kundalini." },
    { name: "mörker", type: "synonym" as const, description: "Klassisk: det okända, dödens rike. Jungianskt: Skuggan, det omedvetna." },
    { name: "dörr", type: "related" as const, description: "Klassisk: övergång, möjlighet. Jungianskt: tröskel till nytt medvetandetillstånd." },
  ],
  aiInterpretation: `Denna dröm bär starka arketypiska drag. Templet som reser sig ur havet symboliserar framväxten av medvetande ur det omedvetna — en rörelse från det formlösa till det heliga.

Ormens närvaro i templets centrum är särskilt intressant. I jungiansk tradition representerar ormen ofta den transformativa energin — den kraft som kan vara destruktiv om den förträngs, men kreativ och helande om den integreras.

Frånvaron av dörrar i templet antyder ett tillstånd av öppenhet — inga barriärer mellan det yttre och det inre. Mörkret som upplevs som inbjudande snarare än hotfullt tyder på en mognad i förhållande till Skuggan.

Drömmen kan tolkas som en inbjudan till djupare självutforskning, där det omedvetna inte upplevs som farligt utan som en källa till visdom.`,
};

export default function PostDetailPage() {
  const [aiExpanded, setAiExpanded] = useState(true);

  return (
    <AppLayout>
      <PageHeader title={postData.title}>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
          <span className="px-2 py-1 bg-accent rounded text-accent-foreground font-medium">{postData.category}</span>
          <span>{postData.date}</span>
          <span>{postData.visibility}</span>
        </div>
      </PageHeader>

      <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-8">
        {/* Main content */}
        <div className="space-y-6">
          {/* Post body */}
          <ContentCard padding="lg">
            <p className="text-xs text-muted-foreground font-body mb-4">Av {postData.author}</p>
            <div className="prose prose-sm max-w-none font-body text-foreground leading-relaxed space-y-4">
              {postData.content.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentCard>

          {/* Matched concepts (Begrepp i fokus) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Begrepp i fokus</h2>
              <span className="text-xs text-muted-foreground font-body">— automatiskt matchade</span>
            </div>
            <div className="space-y-2.5">
              {postData.matchedConcepts.map((concept) => (
                <ContentCard key={concept.name} padding="sm" className="animate-fade-in">
                  <div className="flex items-start gap-3">
                    <ConceptBadge label={concept.name} type={concept.type} />
                    <p className="text-sm text-muted-foreground font-body leading-relaxed flex-1">
                      {concept.description}
                    </p>
                  </div>
                </ContentCard>
              ))}
            </div>
          </div>

          {/* Manual concepts */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-display font-medium text-foreground">Manuellt kopplade begrepp</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {postData.manualConcepts.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <ConceptBadge label={c.name} type="manual" />
                  {c.comment && <span className="text-xs text-muted-foreground font-body italic">{c.comment}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* AI interpretation on mobile */}
          <div className="lg:hidden">
            <AIPanel expanded={aiExpanded} onToggle={() => setAiExpanded(!aiExpanded)} text={postData.aiInterpretation} />
          </div>
        </div>

        {/* Sidebar (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <AIPanel expanded={aiExpanded} onToggle={() => setAiExpanded(!aiExpanded)} text={postData.aiInterpretation} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function AIPanel({ expanded, onToggle, text }: { expanded: boolean; onToggle: () => void; text: string }) {
  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-medium text-foreground">AI-tolkning</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="space-y-3">
            {text.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm text-surface-foreground font-body leading-relaxed">{p}</p>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground font-body italic">
            Denna tolkning är AI-genererad och bör ses som en reflektion, inte en sanning.
          </p>
        </div>
      )}
    </div>
  );
}
