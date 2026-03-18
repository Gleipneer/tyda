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
    label: "Drömläsning",
    summary: "Lyfter symboler, stämningar och rörelser utan att slå fast en enda betydelse.",
    tone: "Symbolisk och varsam",
    cautionLabel: "Hög försiktighet",
  },
  poem: {
    kind: "poem",
    label: "Diktnärläsning",
    summary: "Fokuserar på bildspråk, kontraster och möjliga teman snarare än att förklara bort texten.",
    tone: "Lyhörd och estetisk",
    cautionLabel: "Mellan försiktighet",
  },
  reflection: {
    kind: "reflection",
    label: "Reflektionsläsning",
    summary: "Håller sig nära det som faktiskt skrivs och lyfter möjliga mönster och nästa frågor.",
    tone: "Jordnära och klargörande",
    cautionLabel: "Mellan försiktighet",
  },
};

function normalizeCategoryName(categoryName?: string): string {
  return (categoryName ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getInterpretationPreview(categoryName?: string): InterpretationPreview {
  const normalized = normalizeCategoryName(categoryName);
  if (normalized.includes("drom") || normalized.includes("dream")) {
    return PREVIEWS.dream;
  }
  if (normalized.includes("dikt") || normalized.includes("poesi") || normalized.includes("poem")) {
    return PREVIEWS.poem;
  }
  return PREVIEWS.reflection;
}
