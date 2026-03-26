import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";
import { Sparkles, BookOpen, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { fetchPost, fetchPublicPost } from "@/services/posts";
import { fetchPostConcepts, fetchMatchedConcepts, unlinkConcept } from "@/services/concepts";
import { fetchInterpretStatus, interpretPost } from "@/services/interpret";
import type { InterpretModelOption } from "@/services/interpret";
import { matchTypeLabel } from "@/lib/matchTypeLabels";
import { getInterpretationPreview, type InterpretationPreview } from "@/lib/interpretationContracts";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import VisibilityBadge from "@/components/VisibilityBadge";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeUser } = useActiveUser();
  const postId = id ? Number(id) : 0;
  const [aiExpanded, setAiExpanded] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const isPublicView = location.pathname.startsWith("/utforska/");

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", postId, isPublicView, activeUser?.anvandar_id],
    queryFn: () => (isPublicView ? fetchPublicPost(postId) : fetchPost(postId)),
    enabled: !!postId && (isPublicView || !!activeUser),
  });

  const { data: concepts = [] } = useQuery({
    queryKey: ["post-concepts", postId],
    queryFn: () => fetchPostConcepts(postId),
    enabled: !!postId,
  });

  const { data: matched = { matches: [] } } = useQuery({
    queryKey: ["matched-concepts", postId],
    queryFn: () => fetchMatchedConcepts(postId),
    enabled: !!postId,
  });

  const { data: interpretStatus } = useQuery({
    queryKey: ["interpret-status"],
    queryFn: fetchInterpretStatus,
    staleTime: 30_000,
    refetchOnMount: "always",
  });
  const orderedMatches = useMemo(
    () => [...matched.matches].sort((a, b) => b.score - a.score),
    [matched.matches]
  );

  const [interpretLoading, setInterpretLoading] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!interpretStatus?.model_options?.length) return;
    setSelectedModel((current) => {
      if (interpretStatus.model_options.some((option) => option.id === current)) {
        return current;
      }
      return interpretStatus.model_default;
    });
  }, [interpretStatus]);

  const handleGenerateInterpretation = () => {
    if (!postId) return;
    setInterpretLoading(true);
    setInterpretError(null);
    interpretPost(postId, selectedModel || undefined)
      .then((response) => {
        try {
          sessionStorage.setItem(`tyda.interpret.${postId}`, JSON.stringify(response));
        } catch {
          /* ignore quota */
        }
        navigate(`/posts/${postId}/tolkning`, { state: { interpretation: response } });
      })
      .catch((e) => setInterpretError(e.message))
      .finally(() => setInterpretLoading(false));
  };

  const handleUnlinkConcept = async (postBegreppId: number) => {
    await unlinkConcept(postBegreppId);
    queryClient.invalidateQueries({ queryKey: ["post-concepts", postId] });
  };

  if (!postId) {
    return (
      <AppLayout>
        <div className="text-muted-foreground">Ogiltigt post-ID.</div>
      </AppLayout>
    );
  }

  if (isLoading || !post) {
    return (
      <AppLayout>
        <PageHeader title="Laddar..." />
        <div className="text-sm text-muted-foreground">Laddar post...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader title="Fel" />
        <div className="text-sm text-destructive">
          Kunde inte hämta post. <Link to="/posts" className="underline">← Tillbaka till poster</Link>
        </div>
      </AppLayout>
    );
  }

  const date = new Date(post.skapad_datum).toLocaleDateString("sv-SE");
  const visibleMatches = showAllMatches ? orderedMatches : orderedMatches.slice(0, 6);
  const topSignals = orderedMatches.slice(0, 4).map((match) => match.ord);
  const interpretationPreview = getInterpretationPreview(post.kategori.namn);
  const modelOptions = interpretStatus?.model_options ?? [];
  const formatScore = (score: number) => `${Math.round(score > 1 ? score : score * 100)}%`;

  return (
    <AppLayout>
      <PageHeader title={post.titel}>
        <div className="flex flex-col gap-3 text-xs text-muted-foreground font-body">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-accent rounded-full text-accent-foreground font-medium">{post.kategori.namn}</span>
            <span className="px-2.5 py-1 bg-muted rounded-full">{date}</span>
            <VisibilityBadge value={post.synlighet} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={isPublicView ? "/utforska" : "/mitt-rum"} className="text-primary hover:underline">
              {isPublicView ? "← Utforska" : "← Mitt rum"}
            </Link>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
        <div className="space-y-6">
          <ContentCard padding="lg" className="bg-card/98">
            <p className="text-xs text-muted-foreground font-body mb-4">Av {post.anvandar.anvandarnamn}</p>
            <div className="prose prose-sm max-w-none font-body text-foreground leading-relaxed space-y-4">
              {post.innehall.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </ContentCard>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Begrepp i posten</h2>
            </div>

            <ContentCard padding="sm" className="bg-card/70">
              {topSignals.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {topSignals.map((signal) => (
                    <span key={signal} className="rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground font-body">
                      {signal}
                    </span>
                  ))}
                </div>
              )}
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground font-body">Automatiskt hittade i texten</p>
              {matched.matches.length > 0 ? (
                <div className="space-y-2.5">
                  {visibleMatches.map((m) => (
                    <div key={`${m.begrepp_id}-${m.matched_token}`} className="rounded-xl border border-border/60 bg-background/60 p-3.5">
                      <div className="flex items-start gap-3">
                        <ConceptBadge label={m.ord} type={m.match_type === "phrase" ? "related" : (m.match_type as "exact" | "synonym" | "related")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-muted-foreground font-body">
                              {matchTypeLabel(m.match_type)}
                              {m.matched_token !== m.ord && ` — «${m.matched_token}»`}
                            </p>
                            <span className="text-[11px] text-muted-foreground font-body">
                              {formatScore(m.score)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground font-body leading-relaxed">
                            {m.beskrivning?.slice(0, 140)}{m.beskrivning && m.beskrivning.length > 140 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {matched.matches.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMatches((value) => !value)}
                      className="text-sm text-primary hover:underline"
                    >
                      {showAllMatches ? "Visa färre" : `Visa alla (${matched.matches.length})`}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Inga begrepp hittades automatiskt i texten.</p>
              )}
            </ContentCard>

            <ContentCard padding="sm" className="bg-card/70">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">Det du själv har kopplat</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {concepts.length > 0 ? (
                  concepts.map((c) => (
                    <div key={c.post_begrepp_id} className="flex items-center gap-2">
                      <ConceptBadge label={c.begrepp.ord} type="manual" />
                      {!isPublicView && (
                        <button
                          type="button"
                          onClick={() => handleUnlinkConcept(c.post_begrepp_id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Ta bort
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground font-body">
                    Inga manuella kopplingar ännu.
                  </p>
                )}
              </div>
            </ContentCard>
          </section>

          {!isPublicView && (
            <div className="xl:hidden">
              <AIPanel
                expanded={aiExpanded}
                onToggle={() => setAiExpanded(!aiExpanded)}
                available={interpretStatus?.available}
                loading={interpretLoading}
                error={interpretError}
                preview={interpretationPreview}
                modelOptions={modelOptions}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onGenerate={handleGenerateInterpretation}
              />
            </div>
          )}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-24">
            {!isPublicView ? (
              <AIPanel
                expanded={aiExpanded}
                onToggle={() => setAiExpanded(!aiExpanded)}
                available={interpretStatus?.available}
                loading={interpretLoading}
                error={interpretError}
                preview={interpretationPreview}
                modelOptions={modelOptions}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                onGenerate={handleGenerateInterpretation}
              />
            ) : (
              <ContentCard>
                <h2 className="text-sm font-display font-medium text-foreground mb-2">Publik läsning</h2>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Du läser nu en post från den publika sidan av Tyda. AI-tolkningen är reserverad för den som arbetar i sitt eget rum.
                </p>
              </ContentCard>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function humanizeAIError(raw: string): string {
  if (/openai_api_key|saknas|not configured|inte konfigurerad/i.test(raw)) {
    return "AI-tolkning är inte aktiverad i backend just nu.";
  }
  if (/stöds inte|tillåtna id/i.test(raw)) {
    return "Den valda modellen stöds inte längre. Välj en annan i listan (listan kommer från backend).";
  }
  if (/invalid.*model|modellen/i.test(raw)) {
    return "Den valda AI-modellen går inte att använda just nu.";
  }
  if (/quota|rate|429/i.test(raw)) {
    return "AI-tjänsten är upptagen just nu. Försök igen om en stund.";
  }
  if (/proxies|__init__|unexpected keyword argument/i.test(raw)) {
    return "AI-tolkning kunde inte genereras just nu. Backend behöver startas om med rätt Python-miljö.";
  }
  return "AI-tolkning kunde inte genereras just nu.";
}

function AIPanel({
  expanded,
  onToggle,
  available,
  loading,
  error,
  preview,
  modelOptions,
  selectedModel,
  onSelectModel,
  onGenerate,
}: {
  expanded: boolean;
  onToggle: () => void;
  available?: boolean;
  loading?: boolean;
  error?: string | null;
  preview: InterpretationPreview;
  modelOptions: InterpretModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onGenerate: () => void;
}) {
  const errorDisplay = error ? humanizeAIError(error) : null;
  const activeModel = modelOptions.find((option) => option.id === selectedModel) ?? modelOptions[0];
  const cautionTone = preview.cautionLabel;

  return (
    <div className="bg-surface/75 rounded-2xl border border-border/70 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-medium text-foreground">AI-tolkning</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] text-accent-foreground font-body">
                  {preview.label}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground font-body">
                  {cautionTone}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground font-body leading-relaxed">
                {preview.summary}
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/70 p-3">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">
                Modell
              </label>
              <select
                value={selectedModel}
                onChange={(event) => onSelectModel(event.target.value)}
                disabled={modelOptions.length === 0}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary disabled:opacity-60"
              >
                {modelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground font-body leading-relaxed">
                {activeModel?.description ?? "Välj vilken modell som ska användas för tolkningen."}
              </p>
            </div>

            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Här används postens text, de begrepp som hittats i texten och sådant du själv har kopplat. När du genererar öppnas en egen lugn lässida med tolkningen — inget rått API-dump i samma panel.
            </p>

            {!available && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                <p className="font-medium">AI-tolkning är avstängd</p>
                <p className="mt-1 opacity-90">
                  Backend saknar <span className="font-mono">OPENAI_API_KEY</span> i <span className="font-mono">backend/.env</span>.
                  Lägg till nyckeln och starta om uvicorn för att aktivera tolkning.
                </p>
              </div>
            )}
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!selectedModel || !available}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-body font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              Generera tolkning
            </button>
          )}
          {loading && <p className="text-sm text-muted-foreground">Arbetar med tolkningen… du skickas till lässidan när den är klar.</p>}
          {errorDisplay && (
            <div className="mb-2">
              <p className="text-sm text-destructive">{errorDisplay}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
