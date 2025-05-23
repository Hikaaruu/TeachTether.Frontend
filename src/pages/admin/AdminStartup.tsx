import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function AdminStartup() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  if (!schoolId) return <Navigate to="/404" replace />;

  return <Navigate to={`/admin/schools/${schoolId}`} replace />;
}
