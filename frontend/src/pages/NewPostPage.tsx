import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";
import { fetchCategories } from "@/services/categories";
import { createPost } from "@/services/posts";
import { analyzeTextConcepts } from "@/services/analyze";
import type { MatchedConcept } from "@/services/analyze";
import { matchTypeLabel } from "@/lib/matchTypeLabels";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import VisibilityBadge from "@/components/VisibilityBadge";
import { categoryOptionLabel, pickDreamCategoryId } from "@/lib/categoryLabels";

/** Samma som Poster.Titel VARCHAR(150) i databasen. */
const POST_TITLE_MAX_CHARS = 150;

function useDebounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  const ref = useRef<ReturnType<typeof setTimeout>>();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return ((...args: Parameters<T>) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => fnRef.current(...args), ms);
  }) as T;
}

export default function NewPostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeUser } = useActiveUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<"privat" | "publik">("privat");
  const [matchedConcepts, setMatchedConcepts] = useState<MatchedConcept[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const debouncedAnalyze = useDebounce((text: string) => {
    if (!text.trim()) {
      setMatchedConcepts([]);
      setIsAnalyzing(false);
      return;
    }

    analyzeTextConcepts(text)
      .then((r) => {
        if (mountedRef.current) {
          setMatchedConcepts(r.matches);
          setIsAnalyzing(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setMatchedConcepts([]);
          setIsAnalyzing(false);
        }
      });
  }, 400);

  const handleContentChange = (text: string) => {
    setContent(text);
    setIsAnalyzing(!!text.trim());
    debouncedAnalyze(text);
  };

  const sortedMatches = [...matchedConcepts].sort((a, b) => b.score - a.score);
  const topMatches = sortedMatches.slice(0, 6);
  const leadingSignals = topMatches.slice(0, 3).map((match) => match.ord);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.kategori_id === categoryId) ?? null,
    [categories, categoryId]
  );
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.trim().length;
  const formatScore = (score: number) => {
    const normalized = score > 1 ? score : score * 100;
    return `${Math.round(normalized)}%`;
  };
  const interpretationReadiness = !content.trim()
    ? "Börja skriva så börjar Tyda se mönster."
    : matchedConcepts.length === 0
      ? "Texten finns här, men inga tydliga begrepp har fångats ännu."
      : matchedConcepts.length < 3
        ? "Tyda ser några tydliga spår. Fortsätt skriva så blir mönstret klarare."
        : "Det finns redan tillräckligt med underlag för en första tolkning när posten är sparad.";
  const draftKey = activeUser ? `tyda.draft.${activeUser.anvandar_id}` : null;

  useEffect(() => {
    if (!draftKey || draftLoaded) return;

    const raw = localStorage.getItem(draftKey);
    if (!raw) {
      setDraftLoaded(true);
      return;
    }

    try {
      const draft = JSON.parse(raw) as {
        titel?: string;
        innehall?: string;
        kategori_id?: number;
        synlighet?: "privat" | "publik";
        saved_at?: string;
      };

      if (draft.titel) setTitle(draft.titel);
      if (draft.innehall) {
        setContent(draft.innehall);
        setIsAnalyzing(true);
        debouncedAnalyze(draft.innehall);
      }
      if (typeof draft.kategori_id === "number") setCategoryId(draft.kategori_id);
      if (draft.synlighet) setVisibility(draft.synlighet);
      if (draft.saved_at) setDraftSavedAt(draft.saved_at);
    } catch {
      localStorage.removeItem(draftKey);
    } finally {
      setDraftLoaded(true);
    }
  }, [draftKey, draftLoaded, debouncedAnalyze]);

  useEffect(() => {
    if (!draftKey || !draftLoaded) return;

    if (!title.trim() && !content.trim()) {
      localStorage.removeItem(draftKey);
      setDraftSavedAt(null);
      return;
    }

    const savedAt = new Date().toISOString();
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        titel: title,
        innehall: content,
        kategori_id: categoryId,
        synlighet: visibility,
        saved_at: savedAt,
      })
    );
    setDraftSavedAt(savedAt);
  }, [draftKey, draftLoaded, title, content, categoryId, visibility]);

  useEffect(() => {
    if (categories.length === 0) return;

    setCategoryId((current) => {
      if (current !== null && categories.some((category) => category.kategori_id === current)) {
        return current;
      }
      return pickDreamCategoryId(categories);
    });
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-posts-list"] });
      queryClient.invalidateQueries({ queryKey: ["public-posts"] });
      navigate(`/posts/${data.post_id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !title.trim() || !content.trim() || categoryId === null) return;

    createMutation.mutate({
      kategori_id: categoryId,
      titel: title.trim(),
      innehall: content.trim(),
      synlighet: visibility,
    });
  };

  const badgeType = (m: MatchedConcept): "exact" | "synonym" | "related" | "manual" => {
    if (m.match_type === "exact" || m.match_type === "inflected" || m.match_type === "phrase") return "exact";
    if (m.match_type === "synonym") return "synonym";
    return "related";
  };

  const clearDraft = () => {
    if (!draftKey) return;
    localStorage.removeItem(draftKey);
    setTitle("");
    setContent("");
    setCategoryId(pickDreamCategoryId(categories));
    setVisibility("privat");
    setMatchedConcepts([]);
    setDraftSavedAt(null);
    setIsAnalyzing(false);
  };

  if (!activeUser) {
    return (
      <AppLayout>
        <PageHeader title="Ny post" description="För att skriva i Tyda behöver du först öppna ditt eget rum." />
        <ContentCard>
          <p className="mb-4 text-sm font-body text-muted-foreground">
            Välj eller skapa en användare först. Sedan sparas nya poster direkt i ditt rum.
          </p>
          <Link
            to="/"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90"
          >
            Gå till start
          </Link>
        </ContentCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Ny post"
        description="Skriv i lugn. Börja med texten."
      />

      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-[1040px] gap-4 lg:grid-cols-[minmax(0,1fr),320px] lg:items-start">
        <div className="space-y-3">
          <ContentCard padding="md" className="bg-card">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-body leading-relaxed text-muted-foreground">
                  Börja med texten. Kategori och synlighet ligger bredvid när du behöver dem.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <VisibilityBadge value={visibility} />
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-body text-muted-foreground">
                    {wordCount} ord
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-body text-muted-foreground">
                    {charCount} tecken
                  </span>
                  {draftSavedAt && (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-body text-accent-foreground">
                      Utkast sparat {new Date(draftSavedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="post-title"
                    className="text-sm font-body font-medium text-foreground"
                  >
                    Titel
                  </label>
                  <span
                    className={`text-xs font-mono tabular-nums font-body ${
                      title.length >= POST_TITLE_MAX_CHARS
                        ? "text-destructive"
                        : title.length >= 130
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-muted-foreground"
                    }`}
                    aria-live="polite"
                    aria-label={`Titel: ${title.length} av ${POST_TITLE_MAX_CHARS} tecken`}
                  >
                    {title.length}/{POST_TITLE_MAX_CHARS}
                  </span>
                </div>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ge din post en titel"
                  maxLength={POST_TITLE_MAX_CHARS}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-body text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-body font-medium text-foreground">Innehåll</label>
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Börja skriva din reflektion, dröm eller tanke..."
                  rows={13}
                  className="w-full min-h-[48svh] resize-y rounded-[24px] border border-input bg-background px-4 py-4 text-sm font-body leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 sm:min-h-[360px] lg:min-h-[520px]"
                  required
                />
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface/50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-body uppercase tracking-wider text-muted-foreground">Tyda ser just nu</span>
                  {isAnalyzing ? (
                    <span className="text-xs font-body text-primary">Läser texten...</span>
                  ) : matchedConcepts.length > 0 ? (
                    <span className="text-xs font-body text-primary">{matchedConcepts.length} begrepp hittade</span>
                  ) : (
                    <span className="text-xs font-body text-muted-foreground">Väntar på tydliga träffar</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {topMatches.length > 0 ? (
                    topMatches.map((concept) => (
                      <div key={`${concept.begrepp_id}-${concept.matched_token}`} className="flex flex-col gap-1">
                        <ConceptBadge label={concept.ord} type={badgeType(concept)} />
                        <span className="text-[10px] font-body text-muted-foreground">
                          {matchTypeLabel(concept.match_type)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-body text-muted-foreground">
                      När texten börjar få form dyker de tydligaste orden och motiven upp här.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-body text-foreground">
                      {visibility === "publik"
                        ? "När du sparar publiceras posten också i Utforska."
                        : "När du sparar hamnar posten bara i ditt eget rum."}
                    </p>
                    <p className="text-xs font-body text-muted-foreground">Utkast sparas lokalt medan du skriver.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || categories.length === 0 || categoryId === null}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-body font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70 sm:w-auto"
                  >
                    {createMutation.isPending ? "Sparar..." : visibility === "publik" ? "Spara och publicera" : "Spara i mitt rum"}
                  </button>
                </div>

                {(title || content) && (
                  <div className="mt-2.5 flex justify-start">
                    <button type="button" onClick={clearDraft} className="text-sm text-primary hover:underline">
                      Töm utkast
                    </button>
                  </div>
                )}

                {createMutation.isError && (
                  <p className="mt-3 text-sm text-destructive">{(createMutation.error as Error).message}</p>
                )}
              </div>
            </div>
          </ContentCard>

          {categoriesLoading && categories.length === 0 && (
            <p className="text-sm text-muted-foreground">Laddar kategorier...</p>
          )}
          {!categoriesLoading && categoriesError && (
            <p className="text-sm text-muted-foreground">
              Kunde inte ladda kategorier. Kontrollera att backend körs.
            </p>
          )}
        </div>

        <aside className="space-y-3">
          <ContentCard padding="md" className="bg-card/98">
            <div className="space-y-3.5">
              <div>
                <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-sm font-body leading-relaxed text-muted-foreground">
                  {interpretationReadiness}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
                    Kategori
                  </label>
                  <select
                    value={categoryId ?? ""}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    disabled={categories.length === 0}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  >
                    {categoryId === null && <option value="">Välj kategori</option>}
                    {categories.map((c) => (
                      <option key={c.kategori_id} value={c.kategori_id}>
                        {categoryOptionLabel(c.namn)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-body leading-relaxed text-muted-foreground">
                    {selectedCategory?.beskrivning ?? "Kategorin styr hur posten presenteras och hur AI-tolkningen senare ramas in."}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">
                    Synlighet
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as "privat" | "publik")}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  >
                    <option value="privat">Privat</option>
                    <option value="publik">Publik</option>
                  </select>
                  <p className="mt-2 text-xs font-body leading-relaxed text-muted-foreground">
                    {visibility === "privat"
                      ? "Bara du ser posten i ditt eget rum."
                      : "Posten blir synlig i Utforska när du sparar den."}
                  </p>
                </div>
              </div>
            </div>
          </ContentCard>

          <ContentCard padding="md" className="bg-surface/70">
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-display font-medium text-foreground">Det här ser systemet nu</h3>
                <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">
                  Underlag från texten. Inget sparas som koppling förrän du själv väljer det på postsidan.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Tydligaste spår</p>
                {leadingSignals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {leadingSignals.map((signal) => (
                      <span key={signal} className="rounded-full bg-accent px-3 py-1.5 text-sm font-body text-accent-foreground">
                        {signal}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-body text-muted-foreground">Inga tydliga spår ännu.</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Träffar</p>
                {topMatches.length > 0 ? (
                  <div className="space-y-2">
                    {topMatches.map((concept) => (
                      <div
                        key={`${concept.begrepp_id}-${concept.matched_token}-panel`}
                        className="rounded-xl border border-border/70 bg-background/60 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <ConceptBadge label={concept.ord} type={badgeType(concept)} />
                          <span className="text-[11px] font-body text-muted-foreground">
                            {formatScore(concept.score)}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-body text-muted-foreground">
                          {matchTypeLabel(concept.match_type)}
                          {concept.matched_token !== concept.ord && ` - "${concept.matched_token}"`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-body text-muted-foreground">
                    Tyda väntar på att texten ska ge tydliga motiv, symboler eller ordspår.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Tolkning</p>
                <p className="text-sm font-body leading-relaxed text-muted-foreground">
                  När posten är sparad kan du öppna den och låta Tyda bygga en första tolkning utifrån texten och begreppen som syns här.
                </p>
              </div>
            </div>
          </ContentCard>
        </aside>
      </form>
    </AppLayout>
  );
}


