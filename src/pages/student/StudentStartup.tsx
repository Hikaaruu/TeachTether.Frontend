// File: pages/student/StudentStartup.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export default function StudentStartup() {
  const { user } = useAuth();
  const studentId = user?.entityId; // student’s own ID

  if (!studentId) return <Navigate to="/404" replace />;

  return <Navigate to={`/student/students/${studentId}/results`} replace />;
}
