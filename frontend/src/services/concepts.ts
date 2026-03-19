import { get, post, del } from "./api";

export interface Concept {
  begrepp_id: number;
  ord: string;
  beskrivning: string;
}

export interface PostConcept {
  post_begrepp_id: number;
  begrepp: Concept;
}

export interface MatchedConcept {
  begrepp_id: number;
  ord: string;
  beskrivning: string;
  matched_token: string;
  match_type: string;
  score: number;
}

export function fetchConcepts(): Promise<Concept[]> {
  return get<Concept[]>("/concepts");
}

export function fetchPostConcepts(postId: number): Promise<PostConcept[]> {
  return get<PostConcept[]>(`/posts/${postId}/concepts`);
}

export function fetchMatchedConcepts(postId: number): Promise<{ matches: MatchedConcept[] }> {
  return get<{ matches: MatchedConcept[] }>(`/posts/${postId}/matched-concepts`);
}

export function linkConcept(postId: number, begreppId: number): Promise<{ post_begrepp_id: number }> {
  return post<{ post_begrepp_id: number }>(`/posts/${postId}/concepts`, {
    begrepp_id: begreppId,
  });
}

export function unlinkConcept(postBegreppId: number): Promise<{ message: string }> {
  return del<{ message: string }>(`/post-concepts/${postBegreppId}`);
}
