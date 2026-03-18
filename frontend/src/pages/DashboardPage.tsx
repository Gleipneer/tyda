import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ContentCard from "@/components/ContentCard";
import { Link } from "react-router-dom";
import { ArrowRight, PlusCircle } from "lucide-react";
import { fetchPosts } from "@/services/posts";
import { fetchActivity } from "@/services/activity";
import { fetchConcepts } from "@/services/concepts";

export default function DashboardPage() {
  const { data: posts = [] } = useQuery({ queryKey: ["posts"], queryFn: () => fetchPosts() });
  const { data: concepts = [] } = useQuery({ queryKey: ["concepts"], queryFn: fetchConcepts });
  const { data: activity = [] } = useQuery({ queryKey: ["activity"], queryFn: fetchActivity });

  const recentPosts = posts.slice(0, 5);
  const recentActivity = activity.slice(0, 5);

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Överblick över ditt reflektionsarkiv."
      >
        <Link
          to="/new-post"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-body font-medium hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Ny post
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8 lg:mb-10">
        <StatCard label="Poster" value={posts.length} sublabel="totalt" />
        <StatCard label="Begrepp" value={concepts.length} sublabel="i lexikonet" />
        <StatCard label="Aktivitet" value={activity.length} sublabel="loggade händelser" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-foreground">Senaste poster</h2>
          <Link to="/posts" className="text-sm text-primary hover:text-primary/80 font-body font-medium flex items-center gap-1 transition-colors">
            Visa alla <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentPosts.length > 0 ? recentPosts.map((post) => (
            <Link key={post.post_id} to={`/posts/${post.post_id}`}>
              <ContentCard className="hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-body font-medium text-primary">{post.kategori.namn}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-body">
                        {new Date(post.skapad_datum).toLocaleDateString("sv-SE")}
                      </span>
                    </div>
                    <h3 className="text-base font-display font-medium text-foreground">{post.titel}</h3>
                    <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">
                      {post.innehall.slice(0, 100)}{post.innehall.length > 100 ? "..." : ""}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </ContentCard>
            </Link>
          )) : (
            <ContentCard>
              <p className="text-sm text-muted-foreground font-body">
                Inga poster ännu. <Link to="/new-post" className="text-primary hover:underline">Skapa din första post</Link>.
              </p>
            </ContentCard>
          )}
        </div>

        {recentActivity.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-3">Senaste aktivitet</h2>
            <ContentCard>
              <ul className="space-y-2 text-sm font-body text-muted-foreground">
                {recentActivity.map((a) => (
                  <li key={a.logg_id}>
                    <Link to={`/posts/${a.post_id}`} className="text-primary hover:underline">{a.handelse}</Link>
                    {" — "}
                    {new Date(a.tidpunkt).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                  </li>
                ))}
              </ul>
            </ContentCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
