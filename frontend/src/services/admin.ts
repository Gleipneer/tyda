import { get, post, put, del } from "./api";
import type { User } from "./users";
import type { Post } from "@/types/posts";
import type { Concept } from "./concepts";

export type { Concept };

export interface AdminStats {
  antal_anvandare: number;
  antal_poster: number;
  antal_begrepp: number;
}

export function fetchAdminStats(): Promise<AdminStats> {
  return get<AdminStats>("/admin/stats");
}

export function fetchAdminUsers(): Promise<User[]> {
  return get<User[]>("/admin/users");
}

export function adminCreateUser(body: {
  anvandarnamn: string;
  epost: string;
  losenord: string;
  ar_admin: boolean;
}): Promise<User> {
  return post<User>("/admin/users", body);
}

export function fetchAdminPosts(): Promise<Post[]> {
  return get<Post[]>("/admin/posts");
}

export function adminCreateConcept(body: { ord: string; beskrivning: string }): Promise<{ begrepp_id: number }> {
  return post<{ begrepp_id: number }>("/concepts", body);
}

export function adminUpdateConcept(id: number, body: { ord: string; beskrivning: string }): Promise<{ message: string }> {
  return put<{ message: string }>(`/concepts/${id}`, body);
}

export function adminDeleteConcept(id: number): Promise<{ message: string }> {
  return del<{ message: string }>(`/concepts/${id}`);
}

/** Fördefinierade VG-SQL:er (admin, read-only i backend). */
export interface VgQueryCatalogItem {
  id: string;
  title: string;
  description: string;
  principle: string;
  sql_text: string;
}

export interface VgQueryRunResult {
  query_id: string;
  title: string;
  sql_executed: string;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  kind: "select" | "call";
}

export function fetchVgQueryCatalog(): Promise<VgQueryCatalogItem[]> {
  return get<VgQueryCatalogItem[]>("/admin/vg-queries");
}

export function runVgQuery(queryId: string): Promise<VgQueryRunResult> {
  return post<VgQueryRunResult>(`/admin/vg-queries/${encodeURIComponent(queryId)}/run`, {});
}
