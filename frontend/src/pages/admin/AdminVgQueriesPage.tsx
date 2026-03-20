import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchVgQueryCatalog, runVgQuery } from "@/services/admin";
import type { VgQueryCatalogItem, VgQueryRunResult } from "@/services/admin";
import { Database, Loader2, Play, ScrollText } from "lucide-react";

export default function AdminVgQueriesPage() {
  const { data: catalog = [], isLoading, error } = useQuery({
    queryKey: ["admin-vg-queries"],
    queryFn: fetchVgQueryCatalog,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => catalog.find((q) => q.id === selectedId) ?? catalog[0] ?? null,
    [catalog, selectedId]
  );

  const runMutation = useMutation({
    mutationFn: (id: string) => runVgQuery(id),
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Databasfrågor (VG)"
        description="Fördefinierade, read-only SQL-frågor mot reflektionsarkivets verkliga tabeller. Välj en fråga till vänster och kör den för att se resultatet — samma SQL som visas körs i backend (whitelist, endast admin)."
      />

      {error && (
        <ContentCard className="mb-6 border-destructive/40">
          <p className="text-sm text-destructive font-body">Kunde inte ladda frågelistan. Är du inloggad som admin?</p>
        </ContentCard>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px),minmax(0,1fr)] lg:items-start">
        <ContentCard padding="md" className="bg-card/95 lg:sticky lg:top-24">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span className="text-xs font-body uppercase tracking-wider">Frågelista</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body">Laddar…</p>
          ) : (
            <ul className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {catalog.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(q.id);
                      runMutation.reset();
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-body transition-colors ${
                      (selectedId ?? selected?.id) === q.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="block font-medium text-foreground">{q.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground line-clamp-2">{q.principle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>

        <div className="space-y-4">
          {selected ? (
            <>
              <ContentCard padding="lg" className="bg-card/98">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-foreground">{selected.title}</h2>
                    <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">{selected.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-body text-accent-foreground">
                    {selected.principle}
                  </span>
                </div>

                <div className="mb-4 rounded-xl border border-border/70 bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-body uppercase tracking-wider text-muted-foreground">
                    <ScrollText className="h-3.5 w-3.5" />
                    SQL (samma som körs i backend)
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/80 p-4 text-xs font-mono leading-relaxed text-foreground border border-border/60">
                    {selected.sql_text}
                  </pre>
                </div>

                <button
                  type="button"
                  disabled={runMutation.isPending}
                  onClick={() => runMutation.mutate(selected.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {runMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Kör fråga…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Visa resultat
                    </>
                  )}
                </button>

                {runMutation.isError && (
                  <p className="mt-3 text-sm text-destructive font-body">
                    {(runMutation.error as Error)?.message ?? "Kunde inte köra frågan"}
                  </p>
                )}
              </ContentCard>

              {runMutation.data && <ResultTable data={runMutation.data} />}
            </>
          ) : (
            <ContentCard>
              <p className="text-sm text-muted-foreground font-body">Inga frågor att visa.</p>
            </ContentCard>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function ResultTable({ data }: { data: VgQueryRunResult }) {
  if (data.row_count === 0) {
    return (
      <ContentCard padding="md" className="border-dashed">
        <p className="text-sm font-body text-muted-foreground">
          Frågan gav inga rader just nu (tomt resultat är okej — prova en annan fråga eller kontrollera att databasen har data).
        </p>
      </ContentCard>
    );
  }

  return (
    <ContentCard padding="md" className="bg-surface/70">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-body uppercase tracking-wider text-muted-foreground">
          Resultat ({data.row_count} {data.row_count === 1 ? "rad" : "rader"})
        </p>
        {data.kind === "call" && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">CALL</span>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[480px] border-collapse text-sm font-body">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              {data.columns.map((col) => (
                <th key={col} className="px-3 py-2 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                {data.columns.map((col) => (
                  <td key={col} className="px-3 py-2 align-top text-foreground">
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentCard>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
