import { describe, expect, it } from "vitest";
import { toInterpretationViewModel, tryParseInterpretationPayload } from "./interpretationViewModel";
import type { InterpretResponse } from "@/services/interpret";

function baseResponse(over: Partial<InterpretResponse> = {}): InterpretResponse {
  return {
    interpretation: "",
    model_used: "gpt-4.1-mini",
    disclaimer: "Test disclaimer.",
    contract: {
      kind: "dream",
      label: "Drömläsning",
      tone: "Varsam",
      caution_level: "high",
      section_titles: [],
    },
    sections: [],
    ...over,
  };
}

describe("toInterpretationViewModel", () => {
  it("maps core_reading and caution for dream", () => {
    const vm = toInterpretationViewModel(
      baseResponse({
        sections: [
          { id: "core_reading", title: "Kort", content: "En möjlig kärna." },
          { id: "caution", title: "Försiktighet", content: "Var försiktig här." },
        ],
        matched_highlight: ["orm", "vatten"],
      })
    );
    expect(vm.summary).toContain("möjlig kärna");
    expect(vm.cautionBlock).toContain("Var försiktig");
    expect(vm.conceptTrail).toEqual(["orm", "vatten"]);
    expect(vm.contractKind).toBe("dream");
    expect(vm.intro).toContain("budskap");
  });

  it("maps new dream layer ids", () => {
    const vm = toInterpretationViewModel(
      baseResponse({
        sections: [
          { id: "summary", title: "S", content: "Sammanfattning." },
          { id: "dream_movement", title: "M", content: "Rörelse." },
          { id: "unconscious_message", title: "U", content: "Budskap." },
          { id: "symbolic_lenses", title: "Sym", content: "Linser." },
          { id: "life_readings", title: "L", content: "Liv." },
          { id: "gentle_guidance", title: "G", content: "Vägledning." },
          { id: "reflection_prompt", title: "R", content: "Fråga?" },
          { id: "caution", title: "C", content: "Varsamt." },
        ],
      })
    );
    expect(vm.summary).toContain("Sammanfattning");
    expect(vm.dreamMovement).toContain("Rörelse");
    expect(vm.unconsciousMessage).toContain("Budskap");
    expect(vm.symbolicLenses).toContain("Linser");
    expect(vm.lifeReadings).toContain("Liv");
    expect(vm.gentleGuidance).toContain("Vägledning");
    expect(vm.openReflection).toContain("Fråga");
  });

  it("hides missing sections without crashing", () => {
    const vm = toInterpretationViewModel(
      baseResponse({
        sections: [{ id: "core_reading", title: "Kort", content: "   " }],
      })
    );
    expect(vm.summary).toBeNull();
    expect(vm.motifs).toBeNull();
    expect(vm.cautionBlock.length).toBeGreaterThan(10);
  });

  it("puts unknown section ids in extraSections", () => {
    const vm = toInterpretationViewModel(
      baseResponse({
        sections: [{ id: "custom_bit", title: "Extra", content: "Hej." }],
      })
    );
    expect(vm.extraSections.some((e) => e.body === "Hej.")).toBe(true);
  });
});

describe("tryParseInterpretationPayload", () => {
  it("parses JSON string with sections", () => {
    const raw = JSON.stringify({ sections: [{ id: "a", title: "T", content: "c" }] });
    const s = tryParseInterpretationPayload(raw);
    expect(s?.length).toBe(1);
  });

  it("returns null on garbage", () => {
    expect(tryParseInterpretationPayload("not json")).toBeNull();
  });
});
