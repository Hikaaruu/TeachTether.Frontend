import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import { Student, ClassGroup } from "../../types/models";
import { personName } from "../../utils/format";

export default function TeacherClassGroupStudentsPage() {
  const { user } = useAuth();
  const { groupId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [group, setGroup] = useState<ClassGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const schoolId = user?.schoolId;

  const navigate = useNavigate();

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
                className="hover-underline"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`${s.id}/results`)}
              >
                {personName(s.user)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
