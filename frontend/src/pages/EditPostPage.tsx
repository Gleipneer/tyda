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

      <ContentCard padding="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !content.trim() || categoryId === null) return;
            updateMutation.mutate();
          }}
          className="space-y-6"
        >
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

          <div>
            <label className="mb-1.5 block text-sm font-medium">Innehåll</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm min-h-[280px]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Kategori</label>
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
            <span className="mb-2 block text-sm font-medium">Synlighet</span>
            <div className="flex gap-4">
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
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              {updateMutation.error instanceof Error ? updateMutation.error.message : "Kunde inte spara"}
            </p>
          )}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {updateMutation.isPending ? "Sparar…" : "Spara ändringar"}
          </button>
        </form>
      </ContentCard>
    </AppLayout>
  );
}
