import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ContentCard from "@/components/ContentCard";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import { fetchPosts } from "@/services/posts";
import { fetchPostConcepts } from "@/services/concepts";

export default function AnalyticsPage() {
  const { activeUser } = useActiveUser();
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts-analytics", activeUser?.anvandar_id],
    queryFn: () => fetchPosts({ anvandarId: activeUser!.anvandar_id }),
    enabled: !!activeUser,
  });

  const conceptQueries = useQueries({
    queries: posts.map((post) => ({
      queryKey: ["post-concepts-analytics", post.post_id],
      queryFn: () => fetchPostConcepts(post.post_id),
      enabled: posts.length > 0,
    })),
  });

  const categoryBreakdown = useMemo(() => {
    const grouped = new Map<string, number>();
    posts.forEach((post) => {
      grouped.set(post.kategori.namn, (grouped.get(post.kategori.namn) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .map(([kategori, antal_poster], index) => ({ kategori_id: index, kategori, antal_poster }))
      .sort((a, b) => b.antal_poster - a.antal_poster);
  }, [posts]);

  const topConcepts = useMemo(() => {
    const grouped = new Map<string, number>();
    conceptQueries.forEach((query) => {
      (query.data ?? []).forEach((concept) => {
        grouped.set(concept.begrepp.ord, (grouped.get(concept.begrepp.ord) ?? 0) + 1);
      });
    });
    return Array.from(grouped.entries())
      .map(([ord, antal_kopplingar], index) => ({ begrepp_id: index, ord, antal_kopplingar }))
      .sort((a, b) => b.antal_kopplingar - a.antal_kopplingar);
  }, [conceptQueries]);

  const totalConnections = useMemo(() => topConcepts.reduce((sum, concept) => sum + concept.antal_kopplingar, 0), [topConcepts]);
  const avgPerPost = posts.length > 0 ? (totalConnections / posts.length).toFixed(1) : "0.0";
  const loading = postsLoading || conceptQueries.some((query) => query.isLoading);

  return (
    <AppLayout>
      <PageHeader
        title="Mönster i ditt rum"
        description="En lugn överblick över det du faktiskt har skrivit och kopplat i ditt eget rum."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-8">
        <StatCard label="Totalt poster" value={loading ? "…" : posts.length} />
        <StatCard label="Kopplade begrepp" value={loading ? "…" : totalConnections} />
        <StatCard label="Snitt per post" value={loading ? "…" : avgPerPost} sublabel="manuella kopplingar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Vanligaste begrepp</h2>
          <ContentCard>
            {loading ? (
              <p className="text-sm text-muted-foreground font-body">Laddar statistik...</p>
            ) : topConcepts.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">Du har inga manuella begreppskopplingar ännu.</p>
            ) : (
              <div className="space-y-3">
                {topConcepts.slice(0, 10).map((c, i) => (
                  <div key={c.ord} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-body w-4 text-right">{i + 1}</span>
                    <span className="text-sm font-body font-medium text-foreground capitalize flex-1">{c.ord}</span>
                    <div className="flex-1 max-w-32">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(c.antal_kopplingar / Math.max(topConcepts[0].antal_kopplingar, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-body w-8 text-right">{c.antal_kopplingar}</span>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </div>

        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Poster per kategori</h2>
          <ContentCard>
            {loading ? (
              <p className="text-sm text-muted-foreground font-body">Laddar statistik...</p>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((c) => {
                  const pct = posts.length > 0 ? Math.round((c.antal_poster / posts.length) * 100) : 0;
                  return (
                    <div key={c.kategori_id} className="flex items-center gap-3">
                      <span className="text-sm font-body font-medium text-foreground w-24 capitalize">{c.kategori}</span>
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sage rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-body w-16 text-right">{c.antal_poster} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </ContentCard>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Det här säger vyn</h2>
        <ContentCard>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Den här sidan läser bara det som hör till ditt eget rum. Här ser du därför dina poster, dina kategorier och de manuella begreppskopplingar som faktiskt finns sparade för dem.
          </p>
        </ContentCard>
      </div>
    </AppLayout>
  );
}
