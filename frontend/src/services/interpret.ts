import { get, post } from "./api";

export type InterpretKind =
  | "dream"
  | "poem"
  | "reflection"
  | "text_excerpt"
  | "symbol_focus"
  | "event_experience"
  | "relation_situation"
  | "free";

export interface InterpretModelOption {
  id: string;
  label: string;
  description: string;
  runtime_available?: boolean;
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
  requested_model: string | null;
  used_model: string;
  fallback_used: boolean;
  fallback_reason: string | null;
  provider: string;
  contract_degraded: boolean;
  disclaimer: string;
  contract: InterpretationContract;
  sections: InterpretationSection[];
}

export interface InterpretStatus {
  available: boolean;
  model_default: string;
  model_options: InterpretModelOption[];
  runtime_verification_succeeded: boolean;
  runtime_verification_message: string | null;
}

export function fetchInterpretStatus(): Promise<InterpretStatus> {
  return get<InterpretStatus>("/interpret/status");
}

export interface InterpretPostOptions {
  model?: string;
  interpret_kind?: InterpretKind;
}

export function interpretPost(postId: number, options?: InterpretPostOptions): Promise<InterpretResponse> {
  const body: Record<string, unknown> = {};
  if (options?.model) body.model = options.model;
  if (options?.interpret_kind) body.interpret_kind = options.interpret_kind;
  return post<InterpretResponse>(`/posts/${postId}/interpret`, body);
}
