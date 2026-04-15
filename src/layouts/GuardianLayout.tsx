import { useNavigate } from "react-router-dom";
import AppShell from "./AppShell";

export default function GuardianLayout() {
  const navigate = useNavigate();

  return (
    <AppShell
      navItems={
        <>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("students")}
          >
            My Students
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("announcements")}
          >
            Announcements
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("chats")}
          >
            Chats
          </button>
        </>
      }
    />
  );
}
