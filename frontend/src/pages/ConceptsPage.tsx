import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchConcepts } from "@/services/concepts";

export default function ConceptsPage() {
  const [query, setQuery] = useState("");
  const { data: concepts = [], isLoading, error } = useQuery({
    queryKey: ["concepts"],
    queryFn: fetchConcepts,
  });

  const filteredConcepts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return concepts;
    return concepts.filter(
      (concept) =>
        concept.ord.toLowerCase().includes(q) ||
        concept.beskrivning.toLowerCase().includes(q)
    );
  }, [concepts, query]);

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Begrepp" description="Laddar symbollexikonet..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader title="Begrepp" description="Kunde inte läsa in symbollexikonet." />
        <ContentCard>
          <p className="text-sm text-muted-foreground font-body">
            Kontrollera att backend körs och försök igen.
          </p>
        </ContentCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Begrepp"
        description="Här kan du läsa symbollexikonet i lugnare form. Det här är orden och motiven som Tyda letar efter i dina texter."
      />

      <div className="mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök ord eller betydelse"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-body"
        />
      </div>

      {filteredConcepts.length === 0 ? (
        <ContentCard>
          <p className="text-sm text-muted-foreground font-body">
            {concepts.length === 0 ? "Inga begrepp hittades i lexikonet ännu." : "Inget begrepp matchar din sökning."}
          </p>
        </ContentCard>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-card/96">
          {filteredConcepts.map((concept) => (
            <div key={concept.begrepp_id} className="px-5 py-4 lg:px-6">
              <h3 className="text-base font-display font-medium text-foreground capitalize">{concept.ord}</h3>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground font-body leading-relaxed">{concept.beskrivning}</p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
