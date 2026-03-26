import { createContext, useContext, useMemo, useState } from "react";
import type { SessionUser } from "@/services/authStorage";
import { clearSessionStorage, loadSession, saveSession } from "@/services/authStorage";

interface ActiveUserContextValue {
  activeUser: SessionUser | null;
  setActiveUser: (user: SessionUser) => void;
  clearActiveUser: () => void;
}

const ActiveUserContext = createContext<ActiveUserContextValue | undefined>(undefined);

export function ActiveUserProvider({ children }: { children: React.ReactNode }) {
  const [activeUser, setActiveUserState] = useState<SessionUser | null>(() => loadSession());

  const value = useMemo<ActiveUserContextValue>(
    () => ({
      activeUser,
      setActiveUser: (user) => {
        setActiveUserState(user);
        saveSession(user);
      },
      clearActiveUser: () => {
        setActiveUserState(null);
        clearSessionStorage();
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
