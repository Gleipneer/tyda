import { Navigate, useLocation } from "react-router-dom";
import { useActiveUser } from "@/contexts/ActiveUserContext";

export default function RequireActiveUser({ children }: { children: React.ReactNode }) {
  const { activeUser, authReady } = useActiveUser();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground font-body">
        Laddar session…
      </div>
    );
  }

  if (!activeUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
