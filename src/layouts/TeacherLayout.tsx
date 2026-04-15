import { useNavigate } from "react-router-dom";
import AppShell from "./AppShell";

export default function TeacherLayout() {
  const navigate = useNavigate();

  return (
    <AppShell
      navItems={
        <>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("announcements")}
          >
            Announcements
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("assignments")}
          >
            Assignments
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("classgroups")}
          >
            My Class Groups
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
