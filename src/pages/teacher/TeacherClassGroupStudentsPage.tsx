import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

type ClassGroup = {
  id: number;
  gradeYear: number;
  section: string;
};

export default function TeacherClassGroupStudentsPage() {
  const { user } = useAuth();
  const { groupId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [group, setGroup] = useState<ClassGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const schoolId = user?.schoolId;

  const navigate = useNavigate();

  const studentName = (s: Student) =>
    [s.user.firstName, s.user.middleName, s.user.lastName]
      .filter(Boolean)
      .join(" ");

  useEffect(() => {
    const load = async () => {
      if (!schoolId || !groupId) return;

      setLoading(true);
      try {
        const [groupRes, studentRes] = await Promise.all([
          api.get(`/schools/${schoolId}/classgroups/${groupId}`),
          api.get(`/schools/${schoolId}/classgroups/${groupId}/students`),
        ]);
        setGroup(groupRes.data);
        setStudents(studentRes.data);
      } catch {
        setGroup(null);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [schoolId, groupId]);

  return (
    <div>
      <div className="text-center mb-3">
        <h5 className="mb-0">
          {group
            ? `Students in Group ${group.gradeYear}-${group.section}`
            : "Students"}
        </h5>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-muted">No students in this class group.</p>
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
