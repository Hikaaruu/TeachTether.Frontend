import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function OwnerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-4 py-2">
        <span className="navbar-brand fw-bold text-primary">TeachTether</span>

        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("schools")}
          >
            Schools
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("profile")}
          >
            Profile
          </button>
          <button className="btn btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="container py-4 flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}
