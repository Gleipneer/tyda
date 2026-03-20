import type { InterpretKind } from "@/services/interpret";

export interface InterpretationPreview {
  kind: InterpretKind;
  label: string;
  summary: string;
  tone: string;
  cautionLabel: string;
}

const PREVIEWS: Record<InterpretKind, InterpretationPreview> = {
  dream: {
    kind: "dream",
    label: "Drömtolkning",
    summary: "Symbolik, känsloliv och rörelse i drömmen — flera läsningar möjliga.",
    tone: "Symbolisk och varsam",
    cautionLabel: "Hög försiktighet",
  },
  poem: {
    kind: "poem",
    label: "Dikttolkning",
    summary: "Bildspråk, ton och spänningar — inte biografi som fakta.",
    tone: "Lyhörd och estetisk",
    cautionLabel: "Mellan försiktighet",
  },
  reflection: {
    kind: "reflection",
    label: "Reflektion eller tanke",
    summary: "Nära det uttryckta, med utrymme för behov och mening.",
    tone: "Jordnära och tydlig",
    cautionLabel: "Mellan försiktighet",
  },
  text_excerpt: {
    kind: "text_excerpt",
    label: "Text eller utdrag",
    summary: "Läser materialet som text — utan att göra om allt till dikt eller dröm.",
    tone: "Tydlig och nära materialet",
    cautionLabel: "Mellan försiktighet",
  },
  symbol_focus: {
    kind: "symbol_focus",
    label: "Symbolfokus",
    summary: "Möjliga betydelsefält och resonans — en symbol kan bära mer än en betydelse.",
    tone: "Utforskande",
    cautionLabel: "Hög försiktighet",
  },
  event_experience: {
    kind: "event_experience",
    label: "Händelse eller upplevelse",
    summary: "Känslomässig kärna, konflikt och behov kring det som hände.",
    tone: "Nära upplevelsen",
    cautionLabel: "Mellan försiktighet",
  },
  relation_situation: {
    kind: "relation_situation",
    label: "Relation eller situation",
    summary: "Gränser, tillit, längtan och makt som möjliga läsningar i relationen.",
    tone: "Relationsnära",
    cautionLabel: "Mellan försiktighet",
  },
  free: {
    kind: "free",
    label: "Fri tolkning",
    summary: "Öppen läsning med tyngdpunkt på inre liv — utan att låsa fast en enda tolkning.",
    tone: "Öppen och sammanhängande",
    cautionLabel: "Mellan försiktighet",
  },
};

export const INTERPRET_KIND_OPTIONS: { id: InterpretKind; label: string }[] = [
  { id: "dream", label: "Dröm" },
  { id: "poem", label: "Dikt" },
  { id: "reflection", label: "Reflektion / tanke" },
  { id: "text_excerpt", label: "Text eller utdrag" },
  { id: "symbol_focus", label: "Symbol" },
  { id: "event_experience", label: "Händelse eller upplevelse" },
  { id: "relation_situation", label: "Relation eller situation" },
  { id: "free", label: "Fri tolkning" },
];

function normalizeCategoryName(categoryName?: string): string {
  return (categoryName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** Standard tolkningstyp utifrån postens kategori (förval i UI). */
export function defaultInterpretKindFromCategory(categoryName?: string): InterpretKind {
  const normalized = normalizeCategoryName(categoryName);
  if (normalized.includes("drom") || normalized.includes("dream")) return "dream";
  if (normalized.includes("dikt") || normalized.includes("poesi") || normalized.includes("poem")) return "poem";
  if (normalized.includes("vision")) return "event_experience";
  if (normalized.includes("tanke") || normalized.includes("reflektion") || normalized.includes("reflection")) {
    return "reflection";
  }
  return "free";
}

export function getInterpretationPreviewForKind(kind: InterpretKind): InterpretationPreview {
  return PREVIEWS[kind];
}

/** @deprecated Använd defaultInterpretKindFromCategory + getInterpretationPreviewForKind */
export function getInterpretationPreview(categoryName?: string): InterpretationPreview {
  return getInterpretationPreviewForKind(defaultInterpretKindFromCategory(categoryName));
}
