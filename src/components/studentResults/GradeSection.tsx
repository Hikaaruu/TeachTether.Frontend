import { useState } from "react";
import dayjs from "dayjs";
import { api } from "../../api/client";
import { Grade } from "../../types/models";
import { extractApiErrors } from "../../utils/errors";
import ValidationErrorList from "../ValidationErrorList";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import RecordSection from "./RecordSection";

const gradeTypeOptions = [
  "Exam",
  "Quiz",
  "Homework",
  "Project",
  "LabWork",
  "OralPresentation",
  "ClassParticipation",
  "ExtraCredit",
  "PracticeWork",
  "FinalGrade",
  "Other",
];

const dateFmt = (d: string) => dayjs(d).format("DD MMM YYYY");

interface Props {
  grades: Grade[];
  setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
  schoolId: string;
  subjectId: string;
  studentId: number;
  editable: boolean;
}

export default function GradeSection({
  grades,
  setGrades,
  schoolId,
  subjectId,
  studentId,
  editable,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [delTarget, setDelTarget] = useState<number | null>(null);

  const openCreate = () => {
    setErrors([]);
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g: Grade) => {
    setErrors([]);
    setEditing(g);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors([]);

    try {
      const form = e.target as HTMLFormElement;
      const base = {
        subjectId: +subjectId,
        gradeValue: +form.gradeValue.value,
        gradeType: form.gradeType.value,
        comment: form.comment.value.trim() || null,
      };
      const dto = editing ? base : { ...base, gradeDate: form.date.value };

      const res = editing
        ? await api.put(
            `/schools/${schoolId}/students/${studentId}/grades/${editing.id}`,
            dto,
          )
        : await api.post(
            `/schools/${schoolId}/students/${studentId}/grades`,
            dto,
          );

      const returned = res.data as Grade;
      const saved: Grade =
        returned && typeof returned.id === "number"
          ? returned
          : {
              ...editing!,
              ...dto,
              id: editing!.id,
              gradeDate: editing!.gradeDate,
            };

      setGrades((curr) => {
        const arr = editing
          ? curr.map((g) => (g.id === saved.id ? saved : g))
          : [saved, ...curr];
        return arr.sort(
          (a, b) => dayjs(b.gradeDate).valueOf() - dayjs(a.gradeDate).valueOf(),
        );
      });

      setFormOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      setErrors(extractApiErrors(err, "Failed to save grade."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (delTarget == null) return;
    try {
      await api.delete(
        `/schools/${schoolId}/students/${studentId}/grades/${delTarget}`,
      );
      setGrades((curr) => curr.filter((g) => g.id !== delTarget));
    } catch {
      setErrors(["Failed to delete grade."]);
    } finally {
      setDelTarget(null);
    }
  };

  return (
    <>
      <RecordSection
        title="Grades"
        data={grades}
        editable={editable}
        onAdd={openCreate}
        render={(g: Grade) => (
          <div className="w-100">
            <div className="d-flex align-items-center">
              <span className="badge bg-secondary flex-shrink-0">
                {g.gradeType}
              </span>
              <span className="ms-3">{g.gradeValue}/100</span>{" "}
              <small className="text-muted ms-auto me-2 ps-3">
                Date: {dateFmt(g.gradeDate)}
              </small>
            </div>
            <div className="small text-muted mt-1">
              Teacher: {g.teacherName}
            </div>
            {g.comment && (
              <div className="small text-muted fst-italic mt-1 text-break">
                Comment: {g.comment}
              </div>
            )}
          </div>
        )}
        onEdit={openEdit}
        onDelete={(g) => setDelTarget(g.id)}
      />

      {delTarget != null && (
        <ConfirmDeleteModal
          title="Delete Grade"
          message="Are you sure you want to delete this grade? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}

      {formOpen && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing ? "Edit" : "Create"} Grade Record
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setFormOpen(false);
                      setEditing(null);
                      setErrors([]);
                    }}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Grade Value (0-100)</label>
                    <input
                      name="gradeValue"
                      type="number"
                      className="form-control"
                      defaultValue={editing?.gradeValue ?? ""}
                      step={0.01}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Grade Type</label>
                    <select
                      name="gradeType"
                      className="form-select"
                      defaultValue={editing?.gradeType ?? ""}
                      required
                    >
                      <option value="">-- select --</option>
                      {gradeTypeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!editing && (
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <input
                        name="date"
                        type="date"
                        className="form-control"
                        defaultValue={dayjs().format("YYYY-MM-DD")}
                        required
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Comment (optional)</label>
                    <textarea
                      name="comment"
                      className="form-control"
                      defaultValue={editing?.comment ?? ""}
                    />
                  </div>
                  <ValidationErrorList messages={errors} />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setFormOpen(false);
                      setEditing(null);
                      setErrors([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {submitting ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
