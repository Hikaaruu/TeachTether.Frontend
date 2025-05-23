// File: pages/guardian/GuardianStudentsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";

type Student = {
  id: number;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
};

export default function GuardianStudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const schoolId = user?.schoolId;
  const guardianId = user?.entityId;

  const studentName = (s: Student) =>
    [s.user.firstName, s.user.middleName, s.user.lastName]
      .filter(Boolean)
      .join(" ");

  useEffect(() => {
    const load = async () => {
      if (!schoolId || !guardianId) return;

      setLoading(true);
      try {
        const res = await api.get(
          `/schools/${schoolId}/guardians/${guardianId}/students`
        );
        setStudents(res.data);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [schoolId, guardianId]);

  return (
    <div>
      <div className="text-center mb-3">
        <h5 className="mb-0">My Students</h5>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-muted">You have no assigned students.</p>
      ) : (
        <ul className="list-group">
          {students.map((s) => (
            <li
              key={s.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span
                role="button"
                style={{ cursor: "pointer", textDecoration: "none" }}
                onClick={() => navigate(`${s.id}/results`)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
                {studentName(s)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
