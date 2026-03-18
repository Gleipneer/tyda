import { createContext, useContext, useMemo, useState } from "react";
import type { User } from "@/services/users";

const STORAGE_KEY = "tyda.activeUser";

interface ActiveUserContextValue {
  activeUser: User | null;
  setActiveUser: (user: User) => void;
  clearActiveUser: () => void;
}

const ActiveUserContext = createContext<ActiveUserContextValue | undefined>(undefined);

export function ActiveUserProvider({ children }: { children: React.ReactNode }) {
  const [activeUser, setActiveUserState] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const value = useMemo<ActiveUserContextValue>(
    () => ({
      activeUser,
      setActiveUser: (user) => {
        setActiveUserState(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      },
      clearActiveUser: () => {
        setActiveUserState(null);
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [activeUser]
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
