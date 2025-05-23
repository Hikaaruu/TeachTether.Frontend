import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const allSections = [
  { key: "admins", label: "Admins", roles: ["SchoolOwner"] },
  { key: "students", label: "Students", roles: ["SchoolOwner", "SchoolAdmin"] },
  { key: "teachers", label: "Teachers", roles: ["SchoolOwner", "SchoolAdmin"] },
  {
    key: "guardians",
    label: "Guardians",
    roles: ["SchoolOwner", "SchoolAdmin"],
  },
  {
    key: "classgroups",
    label: "Class Groups",
    roles: ["SchoolOwner", "SchoolAdmin"],
  },
  { key: "subjects", label: "Subjects", roles: ["SchoolOwner", "SchoolAdmin"] },
  {
    key: "announcements",
    label: "Announcements",
    roles: ["SchoolOwner", "SchoolAdmin"],
  },
];

export default function SchoolDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const pathSegments = location.pathname.split("/");
  const schoolIndex = pathSegments.indexOf("schools");
  const active = pathSegments[schoolIndex + 2];

  const role = user?.role;
  const roleBase = role === "SchoolOwner" ? "owner" : "admin";

  return (
    <div className="container pt-2 pb-4">
      <div className="mb-4">
        <div className="nav nav-tabs">
          {allSections
            .filter((s) => s.roles.includes(role ?? ""))
            .map((section) => (
              <button
                key={section.key}
                className={`nav-link ${active === section.key ? "active" : ""}`}
                onClick={() =>
                  navigate(`/${roleBase}/schools/${id}/${section.key}`)
                }
                style={{ cursor: "pointer" }}
              >
                {section.label}
              </button>
            ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
