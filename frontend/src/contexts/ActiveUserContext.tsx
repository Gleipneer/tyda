import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/services/users";
import { fetchMe } from "@/services/users";
import { ACCESS_TOKEN_KEY, setAccessToken as persistToken } from "@/services/api";

const USER_STORAGE_KEY = "tyda.activeUser";

interface ActiveUserContextValue {
  activeUser: User | null;
  /** Sätter användare + JWT (t.ex. efter login). */
  setSession: (user: User, accessToken: string) => void;
  clearActiveUser: () => void;
  /** true medan /auth/me valideras vid start */
  authReady: boolean;
}

const ActiveUserContext = createContext<ActiveUserContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function initialUserState(): User | null {
  const user = readStoredUser();
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  // Efter införande av JWT: rensa gammal session utan token
  if (user && !token) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
  return user;
}

export function ActiveUserProvider({ children }: { children: React.ReactNode }) {
  const [activeUser, setActiveUserState] = useState<User | null>(initialUserState);
  const [authReady, setAuthReady] = useState(false);

  const clearActiveUser = useCallback(() => {
    setActiveUserState(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    persistToken(null);
  }, []);

  const setSession = useCallback((user: User, accessToken: string) => {
    setActiveUserState(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    persistToken(accessToken);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (cancelled) return;
        setActiveUserState(user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      })
      .catch(() => {
        if (cancelled) return;
        clearActiveUser();
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clearActiveUser]);

  const value = useMemo<ActiveUserContextValue>(
    () => ({
      activeUser,
      setSession,
      clearActiveUser,
      authReady,
    }),
    [activeUser, setSession, clearActiveUser, authReady]
  );

  return <ActiveUserContext.Provider value={value}>{children}</ActiveUserContext.Provider>;
}

export function useActiveUser() {
  const ctx = useContext(ActiveUserContext);
  if (!ctx) {
    throw new Error("useActiveUser must be used inside ActiveUserProvider");
  }
  return ctx;
}
