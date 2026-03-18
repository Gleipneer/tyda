import { get } from "./api";

export interface PostsPerCategory {
  kategori_id: number;
  kategori: string;
  antal_poster: number;
}

export interface PostsPerUser {
  anvandar_id: number;
  anvandarnamn: string;
  antal_poster: number;
}

export interface MostUsedConcept {
  begrepp_id: number;
  ord: string;
  antal_kopplingar: number;
}

export function fetchPostsPerCategory(): Promise<PostsPerCategory[]> {
  return get<PostsPerCategory[]>("/analytics/posts-per-category");
}

export function fetchPostsPerUser(): Promise<PostsPerUser[]> {
  return get<PostsPerUser[]>("/analytics/posts-per-user");
}

export function fetchMostUsedConcepts(): Promise<MostUsedConcept[]> {
  return get<MostUsedConcept[]>("/analytics/most-used-concepts");
}
