import { describe, expect, it } from "vitest";
import { categoryOptionLabel, pickDreamCategoryId } from "./categoryLabels";

describe("pickDreamCategoryId", () => {
  it("väljer drom när den finns", () => {
    const id = pickDreamCategoryId([
      { kategori_id: 5, namn: "dikt" },
      { kategori_id: 1, namn: "drom" },
    ]);
    expect(id).toBe(1);
  });

  it("fallback till första när drom saknas", () => {
    const id = pickDreamCategoryId([
      { kategori_id: 2, namn: "vision" },
      { kategori_id: 3, namn: "tanke" },
    ]);
    expect(id).toBe(2);
  });
});

describe("categoryOptionLabel", () => {
  it("visar Dröm för drom", () => {
    expect(categoryOptionLabel("drom")).toBe("Dröm");
  });
});
