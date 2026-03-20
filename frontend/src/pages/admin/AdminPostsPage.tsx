import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchAdminPosts } from "@/services/admin";
import { deletePost } from "@/services/posts";
import { toast } from "@/hooks/use-toast";

export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: fetchAdminPosts,
  });

  const delMut = useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Post borttagen" });
    },
    onError: (e: Error) => {
      toast({ title: "Misslyckades", description: e.message, variant: "destructive" });
    },
  });

  return (
    <AdminLayout>
      <PageHeader title="Alla poster" description="Administratör kan läsa och radera valfri post." />

      <ContentCard>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laddar…</p>
        ) : error ? (
          <p className="text-sm text-destructive">Kunde inte hämta poster.</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga poster i databasen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3">Titel</th>
                  <th className="pb-2 pr-3">Användare</th>
                  <th className="pb-2 pr-3">Kategori</th>
                  <th className="pb-2 pr-3">Synlighet</th>
                  <th className="pb-2 pr-3">Datum</th>
                  <th className="pb-2 text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.post_id} className="border-b border-border/60">
                    <td className="py-3 pr-3 max-w-[200px] truncate font-medium text-foreground" title={p.titel}>
                      {p.titel}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{p.anvandar.anvandarnamn}</td>
                    <td className="py-3 pr-3 capitalize">{p.kategori.namn}</td>
                    <td className="py-3 pr-3">{p.synlighet}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {new Date(p.skapad_datum).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/posts/${p.post_id}`}
                        className="text-primary text-xs hover:underline mr-3"
                      >
                        Öppna
                      </Link>
                      <button
                        type="button"
                        className="text-destructive text-xs hover:underline disabled:opacity-50"
                        disabled={delMut.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Ta bort posten "${p.titel}"? Detta går inte att ångra.`
                            )
                          ) {
                            return;
                          }
                          delMut.mutate(p.post_id);
                        }}
                      >
                        Radera
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </AdminLayout>
  );
}
