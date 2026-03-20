import { Navigate } from "react-router-dom";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import RequireActiveUser from "./RequireActiveUser";

/**
 * Kräver inloggning + ar_admin. Backend validerar admin på alla /admin-anrop.
 */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RequireActiveUser>
      <AdminGate>{children}</AdminGate>
    </RequireActiveUser>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { activeUser } = useActiveUser();
  if (!activeUser?.ar_admin) {
    return <Navigate to="/mitt-rum" replace />;
  }
  return <>{children}</>;
}
