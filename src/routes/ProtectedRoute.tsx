import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UserRole } from "../types/roles";

type ProtectedRouteProps = {
  allow?: UserRole[];
};

export const ProtectedRoute = ({ allow }: ProtectedRouteProps) => {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (allow && !allow.includes(user.role))
    return <Navigate to="/403" replace />;

  return <Outlet />;
};
