import { useNavigate } from "react-router-dom";
import AppShell from "./AppShell";

export default function OwnerLayout() {
  const navigate = useNavigate();

  return (
    <AppShell
      navItems={
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("schools")}
        >
          Schools
        </button>
      }
    />
  );
}
