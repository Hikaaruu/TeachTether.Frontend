import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ClassGroup } from "../../types/models";

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
                className="hover-underline"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`${c.id}/students`)}
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
