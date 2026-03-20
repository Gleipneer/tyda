import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { adminCreateConcept, adminDeleteConcept, adminUpdateConcept } from "@/services/admin";
import { fetchConcepts } from "@/services/concepts";
import { toast } from "@/hooks/use-toast";

export default function AdminConceptsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [newOrd, setNewOrd] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editOrd, setEditOrd] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { data: concepts = [], isLoading } = useQuery({
    queryKey: ["concepts"],
    queryFn: fetchConcepts,
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return concepts;
    return concepts.filter(
      (c) => c.ord.toLowerCase().includes(s) || c.beskrivning.toLowerCase().includes(s)
    );
  }, [concepts, q]);

  const createMut = useMutation({
    mutationFn: () => adminCreateConcept({ ord: newOrd.trim(), beskrivning: newDesc.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concepts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setNewOrd("");
      setNewDesc("");
      toast({ title: "Begrepp skapat" });
    },
    onError: (e: Error) => toast({ title: "Fel", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: () => adminUpdateConcept(editingId!, { ord: editOrd.trim(), beskrivning: editDesc.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concepts"] });
      setEditingId(null);
      toast({ title: "Sparat" });
    },
    onError: (e: Error) => toast({ title: "Fel", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminDeleteConcept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["concepts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Borttaget" });
    },
    onError: (e: Error) => toast({ title: "Fel", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Begrepp"
        description="Hantera symbollexikonet. Radering tar bort kopplingar i PostBegrepp (CASCADE)."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
        <ContentCard>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök ord eller beskrivning"
            className="mb-4 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
          />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laddar…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga träffar.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((c) => (
                <li key={c.begrepp_id} className="py-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-medium text-foreground capitalize">{c.ord}</p>
                    <p className="text-sm text-muted-foreground font-body mt-1">{c.beskrivning}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setEditingId(c.begrepp_id);
                        setEditOrd(c.ord);
                        setEditDesc(c.beskrivning);
                      }}
                    >
                      Redigera
                    </button>
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline disabled:opacity-50"
                      disabled={deleteMut.isPending}
                      onClick={() => {
                        if (!window.confirm(`Ta bort begreppet «${c.ord}» och alla kopplingar?`)) return;
                        deleteMut.mutate(c.begrepp_id);
                      }}
                    >
                      Ta bort
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>

        <div className="space-y-6">
          <ContentCard>
            <h2 className="text-sm font-display font-semibold mb-3">Nytt begrepp</h2>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newOrd.trim() || !newDesc.trim()) return;
                createMut.mutate();
              }}
            >
              <input
                placeholder="Ord"
                value={newOrd}
                onChange={(e) => setNewOrd(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                required
              />
              <textarea
                placeholder="Beskrivning"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={createMut.isPending}
                className="w-full rounded-lg bg-primary py-2 text-sm text-primary-foreground disabled:opacity-60"
              >
                Lägg till
              </button>
            </form>
          </ContentCard>
        </div>
      </div>

      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <ContentCard className="max-w-md w-full shadow-xl">
            <h3 className="font-display font-semibold mb-3">Redigera begrepp</h3>
            <div className="space-y-2">
              <input
                value={editOrd}
                onChange={(e) => setEditOrd(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" className="px-3 py-2 text-sm text-muted-foreground" onClick={() => setEditingId(null)}>
                Avbryt
              </button>
              <button
                type="button"
                disabled={updateMut.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                onClick={() => updateMut.mutate()}
              >
                Spara
              </button>
            </div>
          </ContentCard>
        </div>
      )}
    </AdminLayout>
  );
}
