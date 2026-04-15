import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AppShell from "./AppShell";

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const schoolId = user?.schoolId;

  return (
    <AppShell
      navItems={
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate(`/admin/schools/${schoolId}`)}
          disabled={!schoolId}
        >
          School
        </button>
      }
    />
  );
}
