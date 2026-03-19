import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import PostPreviewCard from "@/components/PostPreviewCard";
import VisibilityBadge from "@/components/VisibilityBadge";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import { fetchPosts } from "@/services/posts";

export default function MyRoomPage() {
  const { activeUser } = useActiveUser();
  const [filter, setFilter] = useState<"alla" | "privat" | "publik">("alla");
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["my-posts", activeUser?.anvandar_id],
    queryFn: () => fetchPosts({ anvandarId: activeUser!.anvandar_id }),
    enabled: !!activeUser,
  });

  const privatePosts = useMemo(() => posts.filter((post) => post.synlighet === "privat"), [posts]);
  const publicPosts = useMemo(() => posts.filter((post) => post.synlighet === "publik"), [posts]);
  const latestPosts = posts.slice(0, 3);
  const visiblePosts = useMemo(() => {
    if (filter === "privat") return privatePosts;
    if (filter === "publik") return publicPosts;
    return posts;
  }, [filter, privatePosts, publicPosts, posts]);

  return (
    <AppLayout>
      <PageHeader
        title={activeUser ? `${activeUser.anvandarnamn}s rum` : "Mitt rum"}
        description="Det här är din privata huvudvy i Tyda. Här ser du det du har sparat för dig själv och det du har valt att visa utåt."
      >
        <Link
          to="/new-post"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          Ny post
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr),320px]">
          <ContentCard padding="lg" className="bg-card/98">
            <p className="mb-3 text-xs font-body uppercase tracking-wider text-muted-foreground">Överblick</p>
            <h2 className="mb-2 text-xl font-display font-semibold text-foreground">Det här finns i ditt rum just nu.</h2>
            <p className="max-w-2xl text-sm font-body leading-relaxed text-muted-foreground">
              Börja med det senaste du skrev, eller hoppa direkt till en ny post om du vill fånga något medan det fortfarande är nära.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatPill label="Privata" value={privatePosts.length} />
              <StatPill label="Publik" value={publicPosts.length} />
            </div>
          </ContentCard>

          <ContentCard className="bg-surface/70">
            <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Nästa steg</p>
            <p className="text-base font-display font-medium text-foreground">Skriv vidare medan det fortfarande är levande.</p>
            <p className="mt-2 text-sm font-body leading-relaxed text-muted-foreground">
              Tyda börjar alltid i ditt privata rum. Därifrån kan du välja vad som ska stanna och vad som ska få bli offentligt.
            </p>
            <Link
              to="/new-post"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ny post
            </Link>
          </ContentCard>
        </div>

        {isLoading ? (
          <ContentCard>
            <p className="text-sm font-body text-muted-foreground">Laddar ditt rum...</p>
          </ContentCard>
        ) : error ? (
          <ContentCard>
            <p className="text-sm font-body text-muted-foreground">Kunde inte läsa in dina poster.</p>
          </ContentCard>
        ) : posts.length === 0 ? (
          <ContentCard padding="lg" className="text-center">
            <div className="mb-5 flex justify-center">
              <img
                src="/images/tyda-mark.png"
                alt="Tyda"
                className="h-28 w-28 rounded-full border border-border/70 bg-accent/20 p-2 object-contain shadow-sm"
              />
            </div>
            <h2 className="mb-2 text-lg font-display font-semibold text-foreground">Det här är ditt rum.</h2>
            <p className="mb-4 text-sm font-body leading-relaxed text-muted-foreground">
              Här samlar du sådant du vill spara för dig själv eller välja att dela senare.
            </p>
            <Link
              to="/new-post"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90"
            >
              Skriv din första post
            </Link>
          </ContentCard>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Senaste från ditt rum</h2>
                <Link to="/posts" className="text-sm text-primary hover:underline">
                  Visa allt
                </Link>
              </div>
              <div className="space-y-3">
                {latestPosts.map((post) => (
                  <PostPreviewCard key={post.post_id} post={post} to={`/posts/${post.post_id}`} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                <FilterButton active={filter === "alla"} onClick={() => setFilter("alla")}>
                  Alla
                </FilterButton>
                <FilterButton active={filter === "privat"} onClick={() => setFilter("privat")}>
                  <span className="inline-flex items-center gap-2">
                    Privata <VisibilityBadge value="privat" className="py-0.5" />
                  </span>
                </FilterButton>
                <FilterButton active={filter === "publik"} onClick={() => setFilter("publik")}>
                  <span className="inline-flex items-center gap-2">
                    Publik <VisibilityBadge value="publik" className="py-0.5" />
                  </span>
                </FilterButton>
              </div>
              <div className="space-y-3">
                {visiblePosts.length > 0 ? (
                  visiblePosts.slice(0, 6).map((post) => (
                    <PostPreviewCard key={post.post_id} post={post} to={`/posts/${post.post_id}`} />
                  ))
                ) : (
                  <ContentCard>
                    <p className="text-sm font-body text-muted-foreground">Inga poster i den här delen ännu.</p>
                  </ContentCard>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full bg-muted px-4 py-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-body">{label}</span>
      <span className="ml-2 text-sm font-body font-medium text-foreground">{value}</span>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm font-body transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}
