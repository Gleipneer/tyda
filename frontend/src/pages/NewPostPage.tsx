import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";
import ConceptLexiconText from "@/components/ConceptLexiconText";
import { fetchCategories } from "@/services/categories";
import { createPost } from "@/services/posts";
import { analyzeTextConcepts, fetchAnalyzeChainStatus } from "@/services/analyze";
import type { MatchedConcept } from "@/services/analyze";
import { matchTypeLabel } from "@/lib/matchTypeLabels";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import VisibilityBadge from "@/components/VisibilityBadge";
import { composePostTextForMatch } from "@/lib/matchText";

/** Samma som Poster.Titel VARCHAR(150) i databasen. */
const POST_TITLE_MAX_CHARS = 150;

/**
 * Debounce med stabil callback-identitet (samma som ms).
 * Tidigare useDebounce skapade ny funktion varje render → onödiga dependency-ändringar och svårdebuggad live-analys.
 */
function useDebouncedCallback<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  fnRef.current = fn;
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );
  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), ms);
    },
    [ms]
  ) as T;
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
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const { data: chainStatus } = useQuery({
    queryKey: ["analyze-chain-status"],
    queryFn: fetchAnalyzeChainStatus,
    staleTime: 60_000,
    retry: 1,
  });

  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const debouncedAnalyze = useDebouncedCallback((text: string) => {
    if (!text.trim()) {
      setMatchedConcepts([]);
      setIsAnalyzing(false);
      setAnalyzeError(null);
      return;
    }

    analyzeTextConcepts(text)
      .then((r) => {
        if (mountedRef.current) {
          const list = r?.matches;
          setMatchedConcepts(Array.isArray(list) ? list : []);
          setAnalyzeError(null);
          setIsAnalyzing(false);
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          setMatchedConcepts([]);
          setAnalyzeError(err instanceof Error ? err.message : "Kunde inte nå symbolanalysen (nätverk eller backend).");
          setIsAnalyzing(false);
        }
      });
  }, 400);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    const live = composePostTextForMatch(v, content);
    setIsAnalyzing(!!live.trim());
    debouncedAnalyze(live);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    const live = composePostTextForMatch(title, text);
    setIsAnalyzing(!!live.trim());
    debouncedAnalyze(live);
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
  const hasWritableText = !!(title.trim() || content.trim());
  const interpretationReadiness = !hasWritableText
    ? "Börja skriva så börjar Tyda se mönster."
    : analyzeError
      ? "Live-symbolanalysen svarade inte. Kontrollera backend och nätverk (se röd text nedan)."
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
      if (draft.innehall) setContent(draft.innehall);
      const liveFromDraft = composePostTextForMatch(draft.titel ?? "", draft.innehall ?? "");
      if (liveFromDraft.trim()) {
        setIsAnalyzing(true);
        debouncedAnalyze(liveFromDraft);
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
      return categories[0].kategori_id;
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
    setCategoryId(categories[0]?.kategori_id ?? null);
    setVisibility("privat");
    setMatchedConcepts([]);
    setAnalyzeError(null);
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

      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr),320px] xl:items-start">
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
                  onChange={handleTitleChange}
                  placeholder="Ge din post en titel"
                  maxLength={POST_TITLE_MAX_CHARS}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-body text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="sticky top-20 z-10 rounded-2xl border border-border/70 bg-background/95 px-4 py-3.5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-body text-foreground">
                      {visibility === "publik"
                        ? "När du sparar blir posten offentlig i Utforska."
                        : "När du sparar stannar posten i ditt eget rum."}
                    </p>
                    <p className="text-xs font-body text-muted-foreground">Spara och utkastskontroller ligger kvar nära editorn.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {(title || content) && (
                      <button type="button" onClick={clearDraft} className="text-sm text-primary hover:underline">
                        Töm utkast
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={createMutation.isPending || categories.length === 0 || categoryId === null}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-body font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70 sm:w-auto"
                    >
                      {createMutation.isPending ? "Sparar..." : visibility === "publik" ? "Spara och publicera" : "Spara i mitt rum"}
                    </button>
                  </div>
                </div>

                {createMutation.isError && (
                  <p className="mt-3 text-sm text-destructive">{(createMutation.error as Error).message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-body font-medium text-foreground">Innehåll</label>
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Börja skriva din reflektion, dröm eller tanke..."
                  rows={13}
                  className="w-full min-h-[50svh] resize-y rounded-[24px] border border-input bg-background px-5 py-5 text-sm font-body leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 sm:min-h-[380px] lg:min-h-[560px]"
                  required
                />
              </div>
            </div>
          </ContentCard>

          <ContentCard padding="md" className="bg-surface/70">
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-display font-medium text-foreground">Det här ser systemet nu</h3>
                <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">
                  Begrepp och databasförklaringar ligger under editorn som ett separat, AI-fritt underlag.
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-body uppercase tracking-wider text-muted-foreground">Tyda ser just nu</span>
                  {analyzeError ? (
                    <span className="text-xs font-body text-destructive" title={analyzeError}>
                      Symbolanalys otillgänglig
                    </span>
                  ) : isAnalyzing ? (
                    <span className="text-xs font-body text-primary">Läser texten...</span>
                  ) : matchedConcepts.length > 0 ? (
                    <span className="text-xs font-body text-primary">{matchedConcepts.length} begrepp hittade</span>
                  ) : (
                    <span className="text-xs font-body text-muted-foreground">Väntar på tydliga träffar</span>
                  )}
                </div>
                {analyzeError && (
                  <p className="mt-2 text-xs font-body text-destructive leading-relaxed">
                    {analyzeError} Kontrollera att backend körs och att du når <code className="rounded bg-muted px-1">POST /api/analyze/text-concepts</code>
                    {import.meta.env.VITE_API_BASE && (
                      <> (VITE_API_BASE={String(import.meta.env.VITE_API_BASE)})</>
                    )}
                  </p>
                )}
                {chainStatus && (
                  <p className="mt-2 text-[11px] font-body leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground/80">Kedjestatus:</span>{" "}
                    {!chainStatus.ok ? (
                      <>databas inte kopplad (GET /api/analyze/chain-status)</>
                    ) : (
                      <>
                        {chainStatus.begrepp_count} begrepp i DB
                        {chainStatus.schema_migrations_applied != null &&
                          ` · ${chainStatus.schema_migrations_applied}/${chainStatus.expected_migrations_files} migrationer spårade`}
                        {chainStatus.lexicon_suspect_incomplete && (
                          <span className="text-amber-600 dark:text-amber-500">
                            {" "}
                            — lexikon/migrationer kan vara ofullständiga; kör{" "}
                            <code className="rounded bg-muted px-1">python scripts/run_migration_utf8.py</code> i
                            backend.
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {topMatches.length > 0 ? (
                    topMatches.map((concept) => (
                      <div
                        key={`${concept.begrepp_id}-${concept.matched_token}`}
                        className="flex flex-col gap-1 rounded-xl border border-border/50 bg-background/40 p-2"
                      >
                        <ConceptBadge label={concept.ord} type={badgeType(concept)} />
                        <span className="text-[10px] font-body text-muted-foreground">
                          {matchTypeLabel(concept.match_type)}
                        </span>
                        <ConceptLexiconText
                          instanceKey={`draft-main-${concept.begrepp_id}-${concept.matched_token}`}
                          beskrivning={concept.beskrivning}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-body text-muted-foreground">
                      När texten börjar få form dyker de tydligaste orden och motiven upp här.
                    </p>
                  )}
                </div>
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

        <aside className="space-y-3 xl:sticky xl:top-20">
          <ContentCard padding="md" className="bg-card/98">
            <div className="space-y-3.5">
              <div>
                <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="text-sm font-body leading-relaxed text-muted-foreground">
                  {interpretationReadiness}
                </p>
              </div>

              {leadingSignals.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Tydligaste spår</p>
                  <div className="flex flex-wrap gap-2">
                    {leadingSignals.map((signal) => (
                      <span key={signal} className="rounded-full bg-accent px-3 py-1.5 text-sm font-body text-accent-foreground">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                        {c.namn}
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
                      ? "Bara du ser posten i ditt eget rum. Den syns inte i Utforska."
                      : "Posten blir synlig i Utforska direkt när du sparar."}
                  </p>
                </div>
              </div>
            </div>
          </ContentCard>

          <ContentCard padding="md" className="bg-surface/70">
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="mb-2 text-xs font-body uppercase tracking-wider text-muted-foreground">Tolkning</p>
                <p className="text-sm font-body leading-relaxed text-muted-foreground">
                  När posten är sparad kan du öppna den och låta Tyda bygga en första tolkning utifrån texten och begreppen under editorn.
                </p>
              </div>
            </div>
          </ContentCard>
        </aside>
      </form>
    </AppLayout>
  );
}


