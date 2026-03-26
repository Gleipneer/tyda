/** Standard kategori för nya poster: dröm (DB-kod `drom`), annars första i listan. */
export function pickDreamCategoryId(categories: { kategori_id: number; namn: string }[]): number | null {
  if (categories.length === 0) return null;
  const dream = categories.find((c) => c.namn.trim().toLowerCase() === "drom");
  return dream?.kategori_id ?? categories[0].kategori_id;
}

/** Visningsetikett (DB lagrar kort kod). */
export function categoryOptionLabel(namn: string): string {
  const n = namn.trim().toLowerCase();
  const labels: Record<string, string> = {
    drom: "Dröm",
    vision: "Vision",
    tanke: "Tanke",
    reflektion: "Reflektion",
    dikt: "Dikt",
  };
  return labels[n] ?? namn;
}
