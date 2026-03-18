import { describe, expect, it } from "vitest";

import { getInterpretationPreview } from "./interpretationContracts";

describe("getInterpretationPreview", () => {
  it("maps dröm category to dream contract", () => {
    const preview = getInterpretationPreview("drom");
    expect(preview.kind).toBe("dream");
    expect(preview.label).toBe("Drömläsning");
  });

  it("maps dikt category to poem contract", () => {
    const preview = getInterpretationPreview("dikt");
    expect(preview.kind).toBe("poem");
    expect(preview.label).toBe("Diktnärläsning");
  });

  it("defaults other categories to reflection contract", () => {
    const preview = getInterpretationPreview("vision");
    expect(preview.kind).toBe("reflection");
    expect(preview.label).toBe("Reflektionsläsning");
  });
});
