import { useState } from "react";
import dayjs from "dayjs";
import { api } from "../../api/client";
import { Behavior } from "../../types/models";
import { extractApiErrors } from "../../utils/errors";
import ValidationErrorList from "../ValidationErrorList";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import RecordSection from "./RecordSection";

const dateFmt = (d: string) => dayjs(d).format("DD MMM YYYY");

interface Props {
  behavior: Behavior[];
  setBehavior: React.Dispatch<React.SetStateAction<Behavior[]>>;
  schoolId: string;
  subjectId: string;
  studentId: number;
  editable: boolean;
}

export default function BehaviorSection({
  behavior,
  setBehavior,
  schoolId,
  subjectId,
  studentId,
  editable,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Behavior | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [delTarget, setDelTarget] = useState<number | null>(null);

  const openCreate = () => {
    setErrors([]);
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (b: Behavior) => {
    setErrors([]);
    setEditing(b);
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
        behaviorScore: +form.behaviorScore.value,
        comment: form.comment.value.trim() || null,
      };
      const dto = editing ? base : { ...base, behaviorDate: form.date.value };

      const res = editing
        ? await api.put(
            `/schools/${schoolId}/students/${studentId}/behavior/${editing.id}`,
            dto,
          )
        : await api.post(
            `/schools/${schoolId}/students/${studentId}/behavior`,
            dto,
          );

      const returned = res.data as Behavior;
      const saved: Behavior =
        returned && typeof returned.id === "number"
          ? returned
          : {
              ...editing!,
              ...dto,
              id: editing!.id,
              behaviorDate: editing!.behaviorDate,
            };

      setBehavior((curr) => {
        const arr = editing
          ? curr.map((b) => (b.id === saved.id ? saved : b))
          : [saved, ...curr];
        return arr.sort(
          (a, b) =>
            dayjs(b.behaviorDate).valueOf() - dayjs(a.behaviorDate).valueOf(),
        );
      });

      setFormOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      setErrors(extractApiErrors(err, "Failed to save behavior record."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (delTarget == null) return;
    try {
      await api.delete(
        `/schools/${schoolId}/students/${studentId}/behavior/${delTarget}`,
      );
      setBehavior((curr) => curr.filter((b) => b.id !== delTarget));
    } catch {
      setErrors(["Failed to delete behavior record."]);
    } finally {
      setDelTarget(null);
    }
  };

  return (
    <>
      <RecordSection
        title="Behavior"
        data={behavior}
        editable={editable}
        onAdd={openCreate}
        render={(b: Behavior) => (
          <div className="w-100">
            <div className="d-flex align-items-center">
              <span className="badge bg-info text-dark flex-shrink-0">
                Behavior
              </span>
              <span className="ms-3">{b.behaviorScore}/10</span>
              <small className="text-muted ms-auto ps-3 me-2">
                Date: {dateFmt(b.behaviorDate)}
              </small>
            </div>
            <div className="small text-muted mt-1">
              Teacher: {b.teacherName}
            </div>
            {b.comment && (
              <div className="small text-muted fst-italic mt-1 text-break">
                Comment: {b.comment}
              </div>
            )}
          </div>
        )}
        onEdit={openEdit}
        onDelete={(b) => setDelTarget(b.id)}
      />

      {delTarget != null && (
        <ConfirmDeleteModal
          title="Delete Behavior Record"
          message="Are you sure you want to delete this record? This action cannot be undone."
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
                    {editing ? "Edit" : "Create"} Behavior Record
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
                    <label className="form-label">Behavior Score (0-10)</label>
                    <input
                      name="behaviorScore"
                      type="number"
                      className="form-control"
                      defaultValue={editing?.behaviorScore ?? ""}
                      step={0.01}
                      required
                    />
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
