/** Dev: proxas via Vite. Produktion: sätt VITE_API_BASE om API ligger på annan origin. */
function normalizeApiBase(raw: string | undefined): string {
  if (raw == null || raw === "") return "/api";
  const trimmed = raw.replace(/\/$/, "");
  if (trimmed === "/api") return "/api";
  if (trimmed.startsWith("http")) {
    try {
      const u = new URL(trimmed);
      if (u.pathname === "/" || u.pathname === "") {
        return `${trimmed}/api`;
      }
    } catch {
      /* ignore */
    }
  }
  return trimmed;
}

/** Aldrig tom sträng — tom bas skulle ge fel URL (404 från Vite istället för API). */
const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE) || "/api";

function joinApiUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

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

async function parseJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    throw new Error(
      "Servern returnerade inte JSON. Kontrollera att API nås (vid separat domän: VITE_API_BASE ska ofta sluta på /api om backend mountar under /api)."
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("Ogiltigt JSON-svar från servern.");
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let body: { detail?: unknown; error?: string } = {};
    try {
      if (text.trim()) body = JSON.parse(text) as { detail?: unknown; error?: string };
    } catch {
      throw new Error(text.slice(0, 280) || res.statusText);
    }
    const msg = body.detail != null ? detailToMessage(body.detail) : body.error || res.statusText;
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const body = await parseJsonBody(res);
  return body as T;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(joinApiUrl(path), { headers: { ...authHeaders() } });
  return handleResponse<T>(res);
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(joinApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(joinApiUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(joinApiUrl(path), { method: "DELETE", headers: { ...authHeaders() } });
  return handleResponse<T>(res);
}
