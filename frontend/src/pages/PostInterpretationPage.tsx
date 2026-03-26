import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { fetchPost } from "@/services/posts";
import type { InterpretResponse } from "@/services/interpret";
import { toInterpretationViewModel } from "@/lib/interpretationViewModel";
import { useActiveUser } from "@/contexts/ActiveUserContext";

const STORAGE_PREFIX = "tyda.interpret.";

function loadFromStorage(postId: number): InterpretResponse | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${postId}`);
    if (!raw) return null;
    return JSON.parse(raw) as InterpretResponse;
  } catch {
    return null;
  }
}

export default function PostInterpretationPage() {
  const { id } = useParams<{ id: string }>();
  const postId = id ? Number(id) : 0;
  const location = useLocation();
  const navigate = useNavigate();
  const { activeUser } = useActiveUser();

  const navPayload = location.state as { interpretation?: InterpretResponse } | undefined;
  const [payload, setPayload] = useState<InterpretResponse | null>(() => navPayload?.interpretation ?? null);

  useEffect(() => {
    if (payload || !postId) return;
    setPayload(loadFromStorage(postId));
  }, [postId, payload]);

  const { data: post } = useQuery({
    queryKey: ["post", postId, activeUser?.anvandar_id],
    queryFn: () => fetchPost(postId),
    enabled: !!postId && !!activeUser,
  });

  const vm = useMemo(() => (payload ? toInterpretationViewModel(payload) : null), [payload]);

  if (!postId) {
    return (
      <AppLayout>
        <p className="text-muted-foreground text-sm">Ogiltigt post-ID.</p>
      </AppLayout>
    );
  }

  if (!vm) {
    return (
      <AppLayout>
        <PageHeader title="Tolkning" description="Ingen tolkning hittades för den här posten i den här fliken." />
        <ContentCard className="max-w-xl">
          <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
            Öppna posten och välj <strong>Generera tolkning</strong> igen, eller gå tillbaka till posten.
          </p>
          <Link
            to={`/posts/${postId}`}
            className="text-sm text-primary font-medium hover:underline"
          >
            ← Tillbaka till posten
          </Link>
        </ContentCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={vm.pageTitle}
        description={post ? `Utifrån: «${post.titel}»` : "Tolkning av din post"}
      >
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-body">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
          >
            ← Tillbaka
          </button>
          <Link to={`/posts/${postId}`} className="text-primary hover:underline">
            Till posten
          </Link>
        </div>
      </PageHeader>

      <div className="mx-auto max-w-3xl space-y-8 pb-16">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-muted/40 to-background/95 px-6 py-8 sm:px-10 sm:py-10 shadow-sm">
          <p className="text-sm sm:text-base text-foreground/90 font-body leading-relaxed">{vm.intro}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-background/80 px-3 py-1 border border-border/50">{vm.contractLabel}</span>
            <span className="rounded-full bg-background/80 px-3 py-1 border border-border/50">Modell: {vm.modelLabel}</span>
          </div>
        </div>

        {vm.summary && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Kort sammanfattning</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.summary}
              </p>
            </div>
          </section>
        )}

        {vm.dreamMovement && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Vad drömmen gör</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.dreamMovement}
              </p>
            </div>
          </section>
        )}

        {vm.unconsciousMessage && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Möjligt budskap från det undermedvetna</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.unconsciousMessage}
              </p>
            </div>
          </section>
        )}

        {vm.symbolicLenses && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Möjliga symboliska läsningar</h2>
            <p className="text-xs text-muted-foreground font-body">
              Olika traditioner som språk — inte som sanning om dig eller om en specifik tro.
            </p>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.symbolicLenses}
              </p>
            </div>
          </section>
        )}

        {vm.lifeReadings && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Möjlig livsbäring</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.lifeReadings}
              </p>
            </div>
          </section>
        )}

        {vm.gentleGuidance && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Varsam vägledning</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.gentleGuidance}
              </p>
            </div>
          </section>
        )}

        {vm.motifs && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Bilder, språk och motiv</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.motifs}
              </p>
            </div>
          </section>
        )}

        {vm.themes && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Möjliga teman</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.themes}
              </p>
            </div>
          </section>
        )}

        {vm.openReflection && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Att bära med sig / öppna frågor</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {vm.openReflection}
              </p>
            </div>
          </section>
        )}

        {vm.conceptTrail.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">Spår i texten (begrepp)</h2>
            <p className="text-xs text-muted-foreground font-body">
              Ord som kan peka mot begrepp i biblioteket — en väg in i texten, inte en förteckning över sanningar.
            </p>
            <div className="flex flex-wrap gap-2">
              {vm.conceptTrail.map((word) => (
                <span
                  key={word}
                  className="rounded-full bg-accent/80 px-3 py-1.5 text-sm text-accent-foreground font-body"
                >
                  {word}
                </span>
              ))}
            </div>
          </section>
        )}

        {vm.extraSections.map((block) => (
          <section key={block.title} className="space-y-2">
            <h2 className="text-lg font-display font-semibold text-foreground">{block.title}</h2>
            <div className="rounded-2xl border border-border/50 bg-card/80 px-5 py-5">
              <p className="text-sm sm:text-[15px] text-foreground/90 font-body leading-[1.65] whitespace-pre-line">
                {block.body}
              </p>
            </div>
          </section>
        ))}

        <ContentCard padding="lg" className="border-amber-500/25 bg-amber-500/[0.06]">
          <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-amber-900/90 dark:text-amber-100/90 mb-2">
            Försiktighet
          </h2>
          <p className="text-sm text-foreground/85 font-body leading-relaxed whitespace-pre-line">{vm.cautionBlock}</p>
        </ContentCard>

        <p className="text-xs text-muted-foreground font-body italic border-t border-border/40 pt-6">{vm.disclaimer}</p>
      </div>
    </AppLayout>
  );
}
