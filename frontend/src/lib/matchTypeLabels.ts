const MATCH_TYPE_LABELS: Record<string, string> = {
  exact: "Exakt träff",
  inflected: "Böjning",
  phrase: "Frasmatch",
  synonym: "Synonym",
  related: "Relaterad träff",
};

export function matchTypeLabel(matchType: string): string {
  return MATCH_TYPE_LABELS[matchType] ?? "Match";
}
