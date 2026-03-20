import { describe, expect, it } from "vitest";

import {
  defaultInterpretKindFromCategory,
  getInterpretationPreview,
  getInterpretationPreviewForKind,
} from "./interpretationContracts";

describe("defaultInterpretKindFromCategory", () => {
  it("maps dröm to dream", () => {
    expect(defaultInterpretKindFromCategory("drom")).toBe("dream");
  });
  it("maps dikt to poem", () => {
    expect(defaultInterpretKindFromCategory("dikt")).toBe("poem");
  });
  it("maps vision to event_experience", () => {
    expect(defaultInterpretKindFromCategory("vision")).toBe("event_experience");
  });
  it("maps reflektion to reflection", () => {
    expect(defaultInterpretKindFromCategory("reflektion")).toBe("reflection");
  });
  it("defaults unknown to free", () => {
    expect(defaultInterpretKindFromCategory("okänd")).toBe("free");
  });
});

describe("getInterpretationPreview", () => {
  it("maps dröm category to dream preview", () => {
    const preview = getInterpretationPreview("drom");
    expect(preview.kind).toBe("dream");
    expect(preview.label).toBe("Drömtolkning");
  });

  it("maps dikt category to poem preview", () => {
    const preview = getInterpretationPreview("dikt");
    expect(preview.kind).toBe("poem");
    expect(preview.label).toBe("Dikttolkning");
  });

  it("maps vision to event experience preview", () => {
    const preview = getInterpretationPreview("vision");
    expect(preview.kind).toBe("event_experience");
    expect(preview.label).toBe("Händelse eller upplevelse");
  });
});

describe("getInterpretationPreviewForKind", () => {
  it("returns free for free kind", () => {
    const p = getInterpretationPreviewForKind("free");
    expect(p.kind).toBe("free");
    expect(p.label).toBe("Fri tolkning");
  });
});
