import { post } from "./api";

export interface MatchedConcept {
  begrepp_id: number;
  ord: string;
  beskrivning: string;
  matched_token: string;
  match_type: string;
  score: number;
}

export function analyzeTextConcepts(text: string): Promise<{ matches: MatchedConcept[] }> {
  return post<{ matches: MatchedConcept[] }>("/analyze/text-concepts", { text });
}
