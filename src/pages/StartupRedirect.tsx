import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function StartupRedirect() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "SchoolOwner":
      return <Navigate to="/owner" replace />;
    case "SchoolAdmin":
      return <Navigate to="/admin" replace />;
    case "Teacher":
      return <Navigate to="/teacher" replace />;
    case "Guardian":
      return <Navigate to="/guardian" replace />;
    case "Student":
      return <Navigate to="/student" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
