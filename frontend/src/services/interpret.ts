import { get, post } from "./api";

export type InterpretKind = "dream" | "poem" | "reflection";

export interface InterpretModelOption {
  id: string;
  label: string;
  description: string;
}

export interface InterpretationSection {
  id: string;
  title: string;
  content: string;
}

export interface InterpretationContract {
  kind: InterpretKind;
  label: string;
  tone: string;
  caution_level: "high" | "medium";
  section_titles: string[];
}

export interface InterpretResponse {
  interpretation: string;
  model_used: string;
  disclaimer: string;
  contract: InterpretationContract;
  sections: InterpretationSection[];
  matched_highlight?: string[];
}

export interface InterpretStatus {
  available: boolean;
  model_default: string;
  model_options: InterpretModelOption[];
}

export function fetchInterpretStatus(): Promise<InterpretStatus> {
  return get<InterpretStatus>("/interpret/status");
}

export function interpretPost(postId: number, model?: string): Promise<InterpretResponse> {
  const qs = model ? `?model=${encodeURIComponent(model)}` : "";
  return post<InterpretResponse>(`/posts/${postId}/interpret${qs}`, {});
}
