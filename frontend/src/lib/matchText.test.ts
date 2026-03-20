import { describe, expect, it } from "vitest";
import { composePostTextForMatch } from "./matchText";

describe("composePostTextForMatch", () => {
  it("matchar backend compose_post_text_for_match (mellanslag)", () => {
    expect(composePostTextForMatch("A", "B")).toBe("A B");
    expect(composePostTextForMatch("", "B")).toBe("B");
    expect(composePostTextForMatch("A", "")).toBe("A");
  });
});
