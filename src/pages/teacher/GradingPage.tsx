import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import StudentResults from "../../components/StudentResults";
import StudentSelector from "../../components/StudentSelector";

export default function GradingPage() {
  const { groupId, subjectId } = useParams();
  const { user } = useAuth();

  const schoolId = user?.schoolId;

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !groupId) return;

    setLoading(true);
    api
      .get(`/schools/${schoolId}/classgroups/${groupId}/students`)
      .then((res) => {
        setStudents(res.data);
        setSelectedStudentId(res.data[0]?.id || null);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [schoolId, groupId]);

  return (
    <div className="d-flex min-vh-100">
      <div className="bg-light border-end" style={{ width: "250px" }}>
        <StudentSelector
          students={students}
          selectedId={selectedStudentId}
          onSelect={setSelectedStudentId}
        />
      </div>

      <div className="flex-grow-1 p-4 overflow-auto">
        {selectedStudentId ? (
          <StudentResults
            schoolId={String(schoolId)}
            subjectId={String(subjectId)}
            studentId={selectedStudentId}
            editable={true}
          />
        ) : (
          <p className="text-muted">Select a student to view records.</p>
        )}
      </div>
    </div>
  );
}
