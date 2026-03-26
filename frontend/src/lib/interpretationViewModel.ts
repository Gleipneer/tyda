/**
 * Presentationslager: InterpretResponse (API) → läsbar view-model utan att krascha på ofullständig struktur.
 */
import type { InterpretResponse, InterpretationSection } from "@/services/interpret";

export interface InterpretationViewModel {
  pageTitle: string;
  intro: string;
  cautionBlock: string;
  summary: string | null;
  /** Dröm: vad som händer + bildernas funktion; dikt/reflektion: bilder/motiv */
  dreamMovement: string | null;
  unconsciousMessage: string | null;
  symbolicLenses: string | null;
  lifeReadings: string | null;
  gentleGuidance: string | null;
  motifs: string | null;
  themes: string | null;
  openReflection: string | null;
  /** Övriga sektioner som inte mappades till kända fack */
  extraSections: { title: string; body: string }[];
  conceptTrail: string[];
  modelLabel: string;
  contractLabel: string;
  contractKind: InterpretResponse["contract"]["kind"];
  disclaimer: string;
}

const SUMMARY_IDS = new Set(["summary", "core_reading"]);
const UNCONSCIOUS_IDS = new Set(["unconscious_message"]);
const SYMBOLIC_LENS_IDS = new Set(["symbolic_lenses"]);
const LIFE_IDS = new Set(["life_readings"]);
const GUIDANCE_IDS = new Set(["gentle_guidance"]);
const DREAM_MOVEMENT_IDS = new Set(["dream_movement"]);
/** Äldre drömkontrakt innan sju lager */
const LEGACY_DREAM_MOVEMENT_IDS = new Set(["symbols", "emotional_current"]);
const MOTIF_POEM_REFLECTION_IDS = new Set(["imagery", "important_signals", "symbols", "emotional_current"]);
const THEME_IDS = new Set(["themes", "patterns"]);
const OPEN_IDS = new Set(["reflection_prompt", "open_question", "next_reflection"]);
const CAUTION_IDS = new Set(["caution"]);

function append(bucket: string | null, text: string): string {
  const t = text.trim();
  if (!t) return bucket ?? "";
  if (!bucket) return t;
  return `${bucket}\n\n${t}`;
}

function normalizeContent(raw: string | unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

/** Parsar ev. JSON-sträng till objekt med sections (används om backend utökar med rå sträng). */
export function tryParseInterpretationPayload(raw: unknown): InterpretationSection[] | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as { sections?: unknown };
      if (Array.isArray(o.sections)) return o.sections as InterpretationSection[];
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw === "object" && raw !== null && "sections" in raw) {
    const s = (raw as { sections: unknown }).sections;
    if (Array.isArray(s)) return s as InterpretationSection[];
  }
  return null;
}

export function toInterpretationViewModel(res: InterpretResponse): InterpretationViewModel {
  const isDream = res.contract.kind === "dream";

  let summary: string | null = null;
  let dreamMovement: string | null = null;
  let unconsciousMessage: string | null = null;
  let symbolicLenses: string | null = null;
  let lifeReadings: string | null = null;
  let gentleGuidance: string | null = null;
  let motifs: string | null = null;
  let themes: string | null = null;
  let openReflection: string | null = null;
  let cautionBlock = "";
  const extraSections: { title: string; body: string }[] = [];

  for (const sec of res.sections) {
    const body = normalizeContent(sec.content);
    if (!body) continue;
    const id = sec.id;
    if (CAUTION_IDS.has(id)) {
      cautionBlock = append(cautionBlock, body);
      continue;
    }
    if (SUMMARY_IDS.has(id)) {
      summary = append(summary, body);
      continue;
    }
    if (UNCONSCIOUS_IDS.has(id)) {
      unconsciousMessage = append(unconsciousMessage, body);
      continue;
    }
    if (SYMBOLIC_LENS_IDS.has(id)) {
      symbolicLenses = append(symbolicLenses, body);
      continue;
    }
    if (LIFE_IDS.has(id)) {
      lifeReadings = append(lifeReadings, body);
      continue;
    }
    if (GUIDANCE_IDS.has(id)) {
      gentleGuidance = append(gentleGuidance, body);
      continue;
    }
    if (isDream && (DREAM_MOVEMENT_IDS.has(id) || LEGACY_DREAM_MOVEMENT_IDS.has(id))) {
      dreamMovement = append(dreamMovement, body);
      continue;
    }
    if (!isDream && MOTIF_POEM_REFLECTION_IDS.has(id)) {
      motifs = append(motifs, body);
      continue;
    }
    if (isDream && MOTIF_POEM_REFLECTION_IDS.has(id) && !LEGACY_DREAM_MOVEMENT_IDS.has(id)) {
      dreamMovement = append(dreamMovement, body);
      continue;
    }
    if (THEME_IDS.has(id)) {
      themes = append(themes, body);
      continue;
    }
    if (OPEN_IDS.has(id)) {
      openReflection = append(openReflection, body);
      continue;
    }
    extraSections.push({ title: sec.title || "Ytterligare spår", body });
  }

  const conceptTrail = Array.isArray(res.matched_highlight)
    ? res.matched_highlight.filter((x) => typeof x === "string" && x.trim())
    : [];

  const introDream =
    "En möjlig läsning av din dröm — med tyngdpunkt på budskap, livsbäring och varsam vägledning. Symboliska spår kan förekomma sparsamt som *språk*, inte som sanning om dig. Inget här ersätter ditt eget omdöme.";
  const introDefault =
    "Det här är en möjlig tolkning av din text — ett öppet underlag att bära med dig, inte ett facit om dig eller din situation.";

  return {
    pageTitle: "Möjlig läsning",
    intro: isDream ? introDream : introDefault,
    cautionBlock:
      cautionBlock.trim() ||
      "Ingen tolkning kan ersätta din egen kännedom. Det som inte känns träffsäkert får du gärna lägga åt sidan.",
    summary: summary?.trim() || null,
    dreamMovement: dreamMovement?.trim() || null,
    unconsciousMessage: unconsciousMessage?.trim() || null,
    symbolicLenses: symbolicLenses?.trim() || null,
    lifeReadings: lifeReadings?.trim() || null,
    gentleGuidance: gentleGuidance?.trim() || null,
    motifs: motifs?.trim() || null,
    themes: themes?.trim() || null,
    openReflection: openReflection?.trim() || null,
    extraSections,
    conceptTrail,
    modelLabel: res.model_used,
    contractLabel: res.contract.label,
    contractKind: res.contract.kind,
    disclaimer: res.disclaimer,
  };
}
