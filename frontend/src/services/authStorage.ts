/** Inloggad användare + JWT (samma struktur som sparas i localStorage). */
export interface SessionUser {
  anvandar_id: number;
  anvandarnamn: string;
  epost: string;
  skapad_datum?: string;
  ar_admin?: boolean;
  access_token: string;
}

const SESSION_KEY = "tyda.session";
const LEGACY_USER_KEY = "tyda.activeUser";

function parseSession(raw: string): SessionUser | null {
  try {
    const data = JSON.parse(raw) as Partial<SessionUser>;
    if (
      typeof data.access_token === "string" &&
      typeof data.anvandar_id === "number" &&
      typeof data.anvandarnamn === "string" &&
      typeof data.epost === "string"
    ) {
      return data as SessionUser;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadSession(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    const s = parseSession(raw);
    if (s) return s;
    localStorage.removeItem(SESSION_KEY);
  }
  const legacy = localStorage.getItem(LEGACY_USER_KEY);
  if (legacy) {
    localStorage.removeItem(LEGACY_USER_KEY);
  }
  return null;
}

export function saveSession(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionStorage(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function getAccessToken(): string | null {
  return loadSession()?.access_token ?? null;
}
