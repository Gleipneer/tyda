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

/** Fördefinierade databasfrågor (admin, skrivskyddade i backend). */
export interface DatabaseQueryCatalogItem {
  id: string;
  title: string;
  description: string;
  principle: string;
  sql_text: string;
}

export interface DatabaseQueryRunResult {
  query_id: string;
  title: string;
  sql_executed: string;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  kind: "select" | "call";
}

export async function fetchDatabaseQueryCatalog(): Promise<DatabaseQueryCatalogItem[]> {
  try {
    return await get<DatabaseQueryCatalogItem[]>("/admin/database-queries");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Not Found") || msg.includes("404")) {
      return get<DatabaseQueryCatalogItem[]>("/admin/vg-queries");
    }
    throw e;
  }
}

export async function runDatabaseQuery(queryId: string): Promise<DatabaseQueryRunResult> {
  const id = encodeURIComponent(queryId);
  try {
    return await post<DatabaseQueryRunResult>(`/admin/database-queries/${id}/run`, {});
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Not Found") || msg.includes("404")) {
      return post<DatabaseQueryRunResult>(`/admin/vg-queries/${id}/run`, {});
    }
    throw e;
  }
}
