import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import PostPreviewCard from "@/components/PostPreviewCard";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import { fetchPublicPosts } from "@/services/posts";
import { fetchCategories } from "@/services/categories";

export default function ExplorePage() {
  const { activeUser } = useActiveUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("alla");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["public-posts"],
    queryFn: fetchPublicPosts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeUser && post.anvandar.anvandar_id === activeUser.anvandar_id) {
        return false;
      }
      if (selectedCategory !== "alla" && post.kategori.namn !== selectedCategory) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${post.titel} ${post.innehall} ${post.anvandar.anvandarnamn}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [posts, activeUser, selectedCategory, query]);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedCategory, query]);

  return (
    <AppLayout>
      <PageHeader
        title="Utforska"
        description="Här läser du sådant som andra har valt att göra offentligt. Det här är den publika sidan av Tyda."
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-border/70 bg-background/95 p-3 backdrop-blur lg:sticky lg:top-20 lg:z-20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök titel, text eller författare"
              className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-body lg:max-w-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterChip active={selectedCategory === "alla"} onClick={() => setSelectedCategory("alla")}>
                Alla
              </FilterChip>
              {categories.map((category) => (
                <FilterChip
                  key={category.kategori_id}
                  active={selectedCategory === category.namn}
                  onClick={() => setSelectedCategory(category.namn)}
                >
                  {category.namn}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <ContentCard>
            <p className="text-sm text-muted-foreground font-body">Laddar offentliga poster...</p>
          </ContentCard>
        ) : error ? (
          <ContentCard>
            <p className="text-sm text-muted-foreground font-body">Kunde inte hämta offentliga poster.</p>
          </ContentCard>
        ) : filteredPosts.length === 0 ? (
          <ContentCard>
            <p className="text-sm text-muted-foreground font-body">
              Det finns inga offentliga poster att visa just nu.
            </p>
          </ContentCard>
        ) : (
          <div className="space-y-3">
            {filteredPosts.slice(0, visibleCount).map((post) => (
              <PostPreviewCard
                key={post.post_id}
                post={post}
                to={`/utforska/${post.post_id}`}
                showAuthor
              />
            ))}
            {filteredPosts.length > visibleCount && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 10)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-body text-foreground hover:bg-muted/70"
                >
                  Visa fler
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function FilterChip({
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
