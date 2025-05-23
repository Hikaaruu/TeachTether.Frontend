// src/pages/owner/ClassGroupPages/ClassGroupSubjectsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";
import ValidationErrorList from "../../../components/ValidationErrorList";

type Subject = {
  id: number;
  name: string;
  schoolId: number;
};

export default function ClassGroupSubjectsPage() {
  const { id: schoolId, groupId } = useParams();
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Subject[]>(`/schools/${schoolId}/subjects`),
      api.get<Subject[]>(
        `/schools/${schoolId}/classgroups/${groupId}/subjects`
      ),
    ])
      .then(([allRes, classRes]) => {
        setAllSubjects(allRes.data);
        setClassSubjects(classRes.data);
      })
      .catch(() => {
        setAllSubjects([]);
        setClassSubjects([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [schoolId, groupId]);

  const handleAdd = async () => {
    setErrors([]);
    if (!selectedId) return;

    try {
      await api.post(`/schools/${schoolId}/classgroups/${groupId}/subjects`, {
        subjectId: selectedId,
      });
      setSelectedId("");
      load();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to add subject."]
      );
    }
  };

  const handleDelete = async (subjectId: number) => {
    try {
      await api.delete(
        `/schools/${schoolId}/classgroups/${groupId}/subjects/${subjectId}`
      );
      load();
    } catch {
      alert("Failed to remove subject.");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Class Group Subjects</h5>
      </div>

      <div className="mb-3 d-flex gap-2">
        <select
          className="form-select"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          <option value="">-- Select subject to add --</option>
          {allSubjects
            .filter((s) => !classSubjects.some((cs) => cs.id === s.id))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!selectedId}
        >
          Add Subject
        </button>
      </div>

      <ValidationErrorList messages={errors} />

      {loading ? (
        <p>Loading...</p>
      ) : classSubjects.length === 0 ? (
        <p className="text-muted">No subjects assigned to this class group.</p>
      ) : (
        <ul className="list-group">
          {classSubjects.map((s) => (
            <li
              key={s.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>{s.name}</div>
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
