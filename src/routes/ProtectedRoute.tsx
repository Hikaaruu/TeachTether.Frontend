import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UserRole } from "../types/roles";

type ProtectedRouteProps = {
  allow?: UserRole[];
};

export const ProtectedRoute = ({ allow }: ProtectedRouteProps) => {
  const { user, ready } = useAuth();

  if (!ready)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;

  if (allow && !allow.includes(user.role))
    return <Navigate to="/403" replace />;

  return <Outlet />;
};
