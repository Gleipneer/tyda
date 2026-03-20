import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchCategories } from "@/services/categories";
import { fetchPost, updatePost } from "@/services/posts";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import type { Synlighet } from "@/types/posts";

const POST_TITLE_MAX_CHARS = 150;

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = id ? Number(id) : 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeUser } = useActiveUser();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<Synlighet>("privat");
  const [hydrated, setHydrated] = useState(false);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId && !!activeUser,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  useEffect(() => {
    if (!post || hydrated) return;
    setTitle(post.titel);
    setContent(post.innehall);
    setCategoryId(post.kategori.kategori_id);
    setVisibility(post.synlighet);
    setHydrated(true);
  }, [post, hydrated]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePost(postId, {
        titel: title.trim(),
        innehall: content.trim(),
        kategori_id: categoryId!,
        synlighet: visibility,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts-list"] });
      queryClient.invalidateQueries({ queryKey: ["public-posts"] });
      navigate(`/posts/${postId}`);
    },
  });

  const canEdit =
    post &&
    activeUser &&
    (activeUser.anvandar_id === post.anvandar.anvandar_id || activeUser.ar_admin);

  if (!postId) {
    return (
      <AppLayout>
        <PageHeader title="Redigera" description="Ogiltigt ID" />
      </AppLayout>
    );
  }

  if (isLoading || !hydrated) {
    return (
      <AppLayout>
        <PageHeader title="Redigera" description="Laddar..." />
        <p className="text-sm text-muted-foreground">Hämtar post…</p>
      </AppLayout>
    );
  }

  if (error || !post) {
    return (
      <AppLayout>
        <PageHeader title="Redigera" description="Kunde inte ladda posten." />
        <Link to="/posts" className="text-primary text-sm underline">
          Tillbaka
        </Link>
      </AppLayout>
    );
  }

  if (!canEdit) {
    return (
      <AppLayout>
        <PageHeader title="Redigera" description="Du har inte behörighet att redigera denna post." />
        <Link to={`/posts/${postId}`} className="text-primary text-sm underline">
          Till posten
        </Link>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Redigera post" description="Ändringar sparas i databasen och kan loggas som aktivitet.">
        <Link to={`/posts/${postId}`} className="text-sm text-primary hover:underline">
          Avbryt
        </Link>
      </PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !content.trim() || categoryId === null) return;
          updateMutation.mutate();
        }}
        className="mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr),320px] xl:items-start"
      >
        <div className="space-y-4">
          <ContentCard padding="lg" className="bg-card/98">
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="edit-title" className="text-sm font-body font-medium text-foreground">
                    Titel
                  </label>
                  <span className="text-xs font-mono tabular-nums text-muted-foreground">
                    {title.length}/{POST_TITLE_MAX_CHARS}
                  </span>
                </div>
                <input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={POST_TITLE_MAX_CHARS}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                  required
                />
              </div>

              <div className="sticky top-20 z-10 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-body text-foreground">
                      {visibility === "publik"
                        ? "Efter sparning ligger posten kvar i ditt rum och visas också i Utforska."
                        : "Efter sparning ligger posten bara kvar i ditt eget rum."}
                    </p>
                    <p className="text-xs font-body text-muted-foreground">Primära kontroller ligger kvar nära editorn.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                  >
                    {updateMutation.isPending ? "Sparar…" : "Spara ändringar"}
                  </button>
                </div>
                {updateMutation.isError && (
                  <p className="mt-3 text-sm text-destructive">
                    {updateMutation.error instanceof Error ? updateMutation.error.message : "Kunde inte spara"}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Innehåll</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full min-h-[50svh] rounded-[24px] border border-input bg-background px-5 py-5 text-sm leading-relaxed resize-y sm:min-h-[360px] lg:min-h-[560px]"
                  required
                />
              </div>
            </div>
          </ContentCard>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-20">
          <ContentCard padding="md" className="bg-card/98">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
                  Kategori
                </label>
                <select
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.kategori_id} value={c.kategori_id}>
                      {c.namn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="mb-2 block text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Synlighet</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="syn"
                      checked={visibility === "privat"}
                      onChange={() => setVisibility("privat")}
                    />
                    Privat
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="syn"
                      checked={visibility === "publik"}
                      onChange={() => setVisibility("publik")}
                    />
                    Publik
                  </label>
                </div>
                <p className="mt-2 text-xs font-body leading-relaxed text-muted-foreground">
                  {visibility === "privat"
                    ? "Privat betyder att bara du och administratör kan läsa posten."
                    : "Publik betyder att posten också kan läsas via Utforska."}
                </p>
              </div>
            </div>
          </ContentCard>
        </aside>
      </form>
    </AppLayout>
  );
}
