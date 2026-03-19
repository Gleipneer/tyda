import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { Link } from "react-router-dom";
import PostPreviewCard from "@/components/PostPreviewCard";
import { fetchPosts } from "@/services/posts";
import { useActiveUser } from "@/contexts/ActiveUserContext";

export default function PostsPage() {
  const { activeUser } = useActiveUser();
  const [filter, setFilter] = useState<"alla" | "privat" | "publik">("alla");
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["my-posts-list", activeUser?.anvandar_id],
    queryFn: () => fetchPosts({ anvandarId: activeUser!.anvandar_id }),
    enabled: !!activeUser,
  });

  const grouped = useMemo(() => {
    const all = posts ?? [];
    return {
      alla: all,
      privata: all.filter((post) => post.synlighet === "privat"),
      publika: all.filter((post) => post.synlighet === "publik"),
    };
  }, [posts]);

  const visiblePosts = useMemo(() => {
    if (filter === "privat") return grouped.privata;
    if (filter === "publik") return grouped.publika;
    return grouped.alla;
  }, [filter, grouped]);

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Mina poster" description="Laddar..." />
        <div className="text-sm text-muted-foreground">Laddar poster...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader title="Mina poster" description="" />
        <div className="text-sm text-destructive">
          Kunde inte hämta poster. Kontrollera att backend körs.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Mina poster"
        description="Här ligger allt du har sparat i Tyda. Börja med det som är viktigast för dig just nu."
      >
        <Link
          to="/new-post"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-body font-medium hover:bg-primary/90 transition-colors"
        >
          Ny post
        </Link>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterButton active={filter === "alla"} onClick={() => setFilter("alla")}>
          Alla ({grouped.alla.length})
        </FilterButton>
        <FilterButton active={filter === "privat"} onClick={() => setFilter("privat")}>
          Privata ({grouped.privata.length})
        </FilterButton>
        <FilterButton active={filter === "publik"} onClick={() => setFilter("publik")}>
          Publik ({grouped.publika.length})
        </FilterButton>
      </div>

      <div className="space-y-3">
        {visiblePosts.length > 0 ? (
          visiblePosts.map((post) => <PostPreviewCard key={post.post_id} post={post} to={`/posts/${post.post_id}`} />)
        ) : (
          <ContentCard padding="lg">
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">Inget här ännu.</h2>
            <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
              Den här delen av ditt rum är tom just nu. Du kan börja med en ny post och välja synlighet efteråt.
            </p>
            <Link
              to="/new-post"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90"
            >
              Skriv en ny post
            </Link>
          </ContentCard>
        )}
      </div>
    </AppLayout>
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
