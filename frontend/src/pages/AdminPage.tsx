import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, Shield, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchActivity } from "@/services/activity";
import { deletePost, fetchPosts } from "@/services/posts";
import { toast } from "sonner";

type AdminTab = "posts" | "logs";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("posts");
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => fetchPosts(),
    enabled: tab === "posts",
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    enabled: tab === "logs",
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Posten är borttagen.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = (postId: number, titel: string) => {
    if (!window.confirm(`Ta bort posten «${titel}» permanent? Detta kan inte ångras.`)) return;
    deleteMutation.mutate(postId);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Administration"
        description="Moderera inlägg och granska hela aktivitetsloggen (inkl. rader som skrivs av databastriggers)."
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body font-medium transition-colors ${
            tab === "posts"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Shield className="h-4 w-4" />
          Alla poster
        </button>
        <button
          type="button"
          onClick={() => setTab("logs")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body font-medium transition-colors ${
            tab === "logs"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" />
          Aktivitetslogg
        </button>
      </div>

      {tab === "posts" && (
        <ContentCard>
          {postsLoading ? (
            <p className="text-sm text-muted-foreground font-body">Laddar poster…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Inga poster i systemet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {posts.map((post) => (
                <li key={post.post_id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-body">
                      #{post.post_id} · {post.kategori.namn} · {post.synlighet}
                    </p>
                    <Link
                      to={`/posts/${post.post_id}`}
                      className="mt-1 block truncate text-base font-display font-medium text-primary hover:underline"
                    >
                      {post.titel}
                    </Link>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      Ägare: {post.anvandar.anvandarnamn} (id {post.anvandar.anvandar_id})
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(post.post_id, post.titel)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-body font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Ta bort
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>
      )}

      {tab === "logs" && (
        <ContentCard>
          {activityLoading ? (
            <p className="text-sm text-muted-foreground font-body">Laddar logg…</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">Ingen aktivitet loggad.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-body">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Tid</th>
                    <th className="pb-2 pr-4 font-medium">Händelse</th>
                    <th className="pb-2 pr-4 font-medium">Post</th>
                    <th className="pb-2 font-medium">Anv. i logg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activity.map((row) => (
                    <tr key={row.logg_id} className="text-foreground">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                        {new Date(row.tidpunkt).toLocaleString("sv-SE")}
                      </td>
                      <td className="py-2.5 pr-4">{row.handelse}</td>
                      <td className="py-2.5 pr-4">
                        <Link to={`/posts/${row.post_id}`} className="text-primary hover:underline">
                          #{row.post_id}
                        </Link>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{row.anvandar_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>
      )}
    </AppLayout>
  );
}
