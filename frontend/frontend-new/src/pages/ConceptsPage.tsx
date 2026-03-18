import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";

const concepts = [
  { id: 1, name: "orm", description: "Klassisk: visdom, förnyelse, helande. Jungianskt: instinkternas energi, kundalini, transformation. Symbolik: cyklisk förändring.", posts: 5 },
  { id: 2, name: "vatten", description: "Klassisk: reningens och livets element. Jungianskt: det omedvetna, känslolivets djup. Symbolik: flöde, rening, förändring.", posts: 8 },
  { id: 3, name: "eld", description: "Klassisk: gudomlig kraft, passion. Jungianskt: libido, psykisk energi. Symbolik: transformation, förstörelse och pånyttfödelse.", posts: 4 },
  { id: 4, name: "tempel", description: "Klassisk: helig plats, kontakt med det gudomliga. Jungianskt: Självet, den inre helheten. Symbolik: andlig strävan.", posts: 3 },
  { id: 5, name: "mörker", description: "Klassisk: det okända, dödens rike. Jungianskt: Skuggan, det omedvetna. Symbolik: det som ännu inte belysts.", posts: 6 },
  { id: 6, name: "ljus", description: "Klassisk: sanning, kunskap. Jungianskt: medvetandets expansion. Symbolik: klarhet, insikt, hopp.", posts: 5 },
  { id: 7, name: "bro", description: "Klassisk: förbindelse, övergång. Jungianskt: transcendent funktion. Symbolik: koppling mellan två tillstånd.", posts: 2 },
  { id: 8, name: "aska", description: "Klassisk: förgänglighet, sorg. Jungianskt: nigredo, den mörka fasen. Symbolik: rester, potential för förnyelse.", posts: 3 },
  { id: 9, name: "hav", description: "Klassisk: det oändliga, moderskötet. Jungianskt: det kollektivt omedvetna. Symbolik: ursprung, djup.", posts: 4 },
  { id: 10, name: "berg", description: "Klassisk: andlig höjd, övervinnande. Jungianskt: individuationsprocessens mål. Symbolik: styrka, beständighet.", posts: 2 },
];

export default function ConceptsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Begrepp"
        description="Symbollexikonet — ord och arketyper som kopplas till dina reflektioner."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {concepts.map((concept) => (
          <ContentCard key={concept.id}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-display font-medium text-foreground capitalize">{concept.name}</h3>
              <span className="text-xs text-muted-foreground font-body shrink-0">{concept.posts} poster</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{concept.description}</p>
          </ContentCard>
        ))}
      </div>
    </AppLayout>
  );
}
