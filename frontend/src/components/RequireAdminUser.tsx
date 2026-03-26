import { Navigate, useLocation } from "react-router-dom";
import { useActiveUser } from "@/contexts/ActiveUserContext";

export default function RequireAdminUser({ children }: { children: React.ReactNode }) {
  const { activeUser } = useActiveUser();
  const location = useLocation();

  if (!activeUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (!activeUser.ar_admin) {
    return <Navigate to="/mitt-rum" replace />;
  }

  return <>{children}</>;
}
