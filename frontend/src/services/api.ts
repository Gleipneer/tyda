/** Dev: proxas via Vite. Produktion: sätt VITE_API_BASE om API ligger på annan origin (t.ex. https://api.example.com). */
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/** Synkas med ActiveUserContext – använd setAccessToken/clearAccessToken därifrån. */
export const ACCESS_TOKEN_KEY = "tyda.accessToken";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const t = getAccessToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

function detailToMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    return first?.msg ?? JSON.stringify(detail);
  }
  return "Begäran misslyckades";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const body = err as { detail?: unknown; error?: string };
    const msg = body.detail != null ? detailToMessage(body.detail) : body.error || res.statusText;
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } });
  return handleResponse<T>(res);
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: { ...authHeaders() } });
  return handleResponse<T>(res);
}
