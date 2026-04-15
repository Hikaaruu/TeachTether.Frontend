import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AppShell from "./AppShell";

export default function StudentLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.entityId;

  return (
    <AppShell
      navItems={
        <>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`students/${studentId}/results`)}
          >
            My Results
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("announcements")}
          >
            Announcements
          </button>
        </>
      }
    />
  );
}
