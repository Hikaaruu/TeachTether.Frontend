// src/pages/owner/ClassGroupStudentsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";
import ValidationErrorList from "../../../components/ValidationErrorList";

type Student = {
  id: number;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
};

export default function ClassGroupStudentsPage() {
  const { id: schoolId, groupId } = useParams();
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Student[]>(`/schools/${schoolId}/students/without-class-group`),
      api.get<Student[]>(
        `/schools/${schoolId}/classgroups/${groupId}/students`
      ),
    ])
      .then(([unassignedRes, classRes]) => {
        setAvailableStudents(unassignedRes.data);
        setClassStudents(classRes.data);
      })
      .catch(() => {
        setAvailableStudents([]);
        setClassStudents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [schoolId, groupId]);

  const handleAdd = async () => {
    setErrors([]);
    if (!selectedId) return;

    try {
      await api.post(`/schools/${schoolId}/classgroups/${groupId}/students`, {
        studentId: selectedId,
      });
      setSelectedId("");
      load();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to add student."]
      );
    }
  };

  const handleDelete = async (studentId: number) => {
    try {
      await api.delete(
        `/schools/${schoolId}/classgroups/${groupId}/students/${studentId}`
      );
      load();
    } catch {
      alert("Failed to remove student.");
    }
  };

  const studentName = (s: Student) =>
    [s.user.firstName, s.user.middleName, s.user.lastName]
      .filter(Boolean)
      .join(" ");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Class Group Students</h5>
      </div>

      {/* Add student */}
      <div className="mb-3 d-flex gap-2">
        <select
          className="form-select"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          <option value="">-- Select student to add --</option>
          {availableStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {studentName(s)}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!selectedId}
        >
          Add Student
        </button>
      </div>

      <ValidationErrorList messages={errors} />

      {/* Current class students */}
      {loading ? (
        <p>Loading...</p>
      ) : classStudents.length === 0 ? (
        <p className="text-muted">No students in this class group.</p>
      ) : (
        <ul className="list-group">
          {classStudents.map((s) => (
            <li
              key={s.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>{studentName(s)}</div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(s.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
