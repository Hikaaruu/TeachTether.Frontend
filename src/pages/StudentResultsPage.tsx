import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import SubjectSelector from "../components/SubjectSelector";
import StudentResults from "../components/StudentResults";

type Subject = {
  id: number;
  name: string;
  schoolId: number;
};

type ClassGroup = {
  id: number;
  gradeYear: number;
  section: string;
  homeroomTeacherId: number;
  schoolId: number;
};

export default function StudentSubjectResultsPage() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const schoolId = user?.schoolId;

  const [classGroupId, setClassGroupId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!schoolId || !studentId) return;

      setLoading(true);
      try {
        const groupRes = await api.get<ClassGroup>(
          `/schools/${schoolId}/students/${studentId}/classgroup`
        );
        const groupId = groupRes.data.id;
        setClassGroupId(String(groupId));

        const subjectsRes = await api.get<Subject[]>(
          `/schools/${schoolId}/classgroups/${groupId}/subjects`
        );
        setSubjects(subjectsRes.data);
        setSelectedSubjectId(subjectsRes.data[0]?.id || null);
      } catch {
        setSubjects([]);
        setClassGroupId(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [schoolId, studentId]);

  return (
    <div className="d-flex min-vh-100">
      <div className="bg-light border-end" style={{ width: "250px" }}>
        <SubjectSelector
          subjects={subjects}
          selectedId={selectedSubjectId}
          onSelect={setSelectedSubjectId}
        />
      </div>

      <div className="flex-grow-1 p-4 overflow-auto">
        {selectedSubjectId && studentId ? (
          <StudentResults
            schoolId={String(schoolId)}
            subjectId={String(selectedSubjectId)}
            studentId={Number(studentId)}
            editable={false}
          />
        ) : (
          <p className="text-muted">
            {loading ? "Loading..." : "Select a subject to view results."}
          </p>
        )}
      </div>
    </div>
  );
}
