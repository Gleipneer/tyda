import { get, post } from "./api";

export interface AnalyzeChainStatus {
  ok: boolean;
  database: string;
  begrepp_count: number;
  schema_migrations_applied: number | null;
  lexicon_suspect_incomplete: boolean;
  expected_migrations_files: number;
  hint: string;
}

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

/** Diagnostik: antal begrepp i DB, migrationsspårning — samma datakälla som live-matchning. */
export function fetchAnalyzeChainStatus(): Promise<AnalyzeChainStatus> {
  return get<AnalyzeChainStatus>("/analyze/chain-status");
}
