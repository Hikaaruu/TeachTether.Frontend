// src/pages/owner/ClassGroupPages/ClassGroupSubjectsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api/client";
import ValidationErrorList from "../../../components/ValidationErrorList";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";

type Subject = {
  id: number;
  name: string;
  schoolId: number;
};

type ConfirmState = {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
} | null;

export default function ClassGroupSubjectsPage() {
  const { id: schoolId, groupId } = useParams();
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

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

  /* ---------- Add subject ---------- */
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

  /* ---------- Remove subject (un-assign) ---------- */
  const queueRemoveSubject = (subjectId: number) =>
    setConfirm({
      title: "Remove Subject",
      message:
        "Remove this subject from the class group? All existing records for this subject will also be deleted. This cannot be undone.",
      onConfirm: async () => {
        await api.delete(
          `/schools/${schoolId}/classgroups/${groupId}/subjects/${subjectId}`
        );
        load();
      },
    });

  /* ---------- Delete all student records for subject ---------- */
  const queueDeleteRecords = (subjectId: number) =>
    setConfirm({
      title: "Delete All Records",
      message:
        "Delete every grade, attendance and behaviour record for this subject in this class group? This cannot be undone.",
      onConfirm: async () => {
        await api.delete(
          `/schools/${schoolId}/StudentRecords/classgroups/${groupId}/subjects/${subjectId}`
        );
        load();
      },
    });

  /* ---------- Modal helpers ---------- */
  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      await confirm.onConfirm();
    } finally {
      setConfirm(null);
    }
  };
  const handleCancel = () => setConfirm(null);

  return (
    <div>
      {/* Heading */}
      <div className="d-flex justify-content-center align-items-center mb-3">
        <h5 className="mb-0 text-center">Class Group Subjects</h5>
      </div>

      {/* Add-subject control */}
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
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-warning text-dark"
                  onClick={() => queueDeleteRecords(s.id)}
                >
                  Delete&nbsp;Records
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => queueRemoveSubject(s.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Shared confirmation modal */}
      {confirm && (
        <ConfirmDeleteModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
