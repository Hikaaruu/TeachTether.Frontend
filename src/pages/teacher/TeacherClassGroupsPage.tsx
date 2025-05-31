// File: pages/teacher/TeacherClassGroupsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

type ClassGroup = {
  id: number;
  gradeYear: number;
  section: string;
  homeroomTeacherId: number;
  schoolId: number;
};

export default function TeacherClassGroupsPage() {
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/teachers/me/homeroom-classgroups");
        setClassGroups(res.data);
      } catch {
        setClassGroups([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-center mb-3">
        <h5 className="mb-0">Your Class Groups</h5>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : classGroups.length === 0 ? (
        <p className="text-muted">
          You are not a homeroom teacher for any class groups.
        </p>
      ) : (
        <ul className="list-group">
          {classGroups.map((c) => (
            <li
              key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span
                role="button"
                style={{ cursor: "pointer", textDecoration: "none" }}
                onClick={() => navigate(`${c.id}/students`)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
                Grade {c.gradeYear}-{c.section}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
