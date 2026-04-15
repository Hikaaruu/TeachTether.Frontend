import { useState } from "react";
import dayjs from "dayjs";
import { api } from "../../api/client";
import { Attendance } from "../../types/models";
import { extractApiErrors } from "../../utils/errors";
import ValidationErrorList from "../ValidationErrorList";
import ConfirmDeleteModal from "../ConfirmDeleteModal";
import RecordSection from "./RecordSection";

const attendanceStatusOptions = ["Present", "Absent", "Late", "Excused"];

const dateFmt = (d: string) => dayjs(d).format("DD MMM YYYY");
const statusBadge = (s: string) =>
  ({
    Present: "bg-success",
    Absent: "bg-danger",
    Late: "bg-warning text-dark",
    Excused: "bg-info text-dark",
  })[s] ?? "bg-secondary";

interface Props {
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  schoolId: string;
  subjectId: string;
  studentId: number;
  editable: boolean;
}

export default function AttendanceSection({
  attendance,
  setAttendance,
  schoolId,
  subjectId,
  studentId,
  editable,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [delTarget, setDelTarget] = useState<number | null>(null);

  const openCreate = () => {
    setErrors([]);
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: Attendance) => {
    setErrors([]);
    setEditing(a);
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
        status: form.status.value,
        comment: form.comment.value.trim() || null,
      };
      const dto = editing ? base : { ...base, attendanceDate: form.date.value };

      const res = editing
        ? await api.put(
            `/schools/${schoolId}/students/${studentId}/attendance/${editing.id}`,
            dto,
          )
        : await api.post(
            `/schools/${schoolId}/students/${studentId}/attendance`,
            dto,
          );

      const returned = res.data as Attendance;
      const saved: Attendance =
        returned && typeof returned.id === "number"
          ? returned
          : {
              ...editing!,
              ...dto,
              id: editing!.id,
              attendanceDate: editing!.attendanceDate,
            };

      setAttendance((curr) => {
        const arr = editing
          ? curr.map((a) => (a.id === saved.id ? saved : a))
          : [saved, ...curr];
        return arr.sort(
          (a, b) =>
            dayjs(b.attendanceDate).valueOf() -
            dayjs(a.attendanceDate).valueOf(),
        );
      });

      setFormOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      setErrors(extractApiErrors(err, "Failed to save attendance record."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (delTarget == null) return;
    try {
      await api.delete(
        `/schools/${schoolId}/students/${studentId}/attendance/${delTarget}`,
      );
      setAttendance((curr) => curr.filter((a) => a.id !== delTarget));
    } catch {
      setErrors(["Failed to delete attendance record."]);
    } finally {
      setDelTarget(null);
    }
  };

  return (
    <>
      <RecordSection
        title="Attendance"
        data={attendance}
        editable={editable}
        onAdd={openCreate}
        render={(a: Attendance) => (
          <div className="w-100">
            <div className="d-flex align-items-center">
              <span className={`badge ${statusBadge(a.status)} flex-shrink-0`}>
                {a.status}
              </span>
              <small className="text-muted ms-auto ps-3 me-2">
                Date: {dateFmt(a.attendanceDate)}
              </small>
            </div>
            <div className="small text-muted mt-1">
              Teacher: {a.teacherName}
            </div>
            {a.comment && (
              <div className="small text-muted fst-italic mt-1 text-break">
                Comment: {a.comment}
              </div>
            )}
          </div>
        )}
        onEdit={openEdit}
        onDelete={(a) => setDelTarget(a.id)}
      />

      {delTarget != null && (
        <ConfirmDeleteModal
          title="Delete Attendance Record"
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
                    {editing ? "Edit" : "Create"} Attendance Record
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
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-select"
                      defaultValue={editing?.status ?? ""}
                      required
                    >
                      <option value="">-- select --</option>
                      {attendanceStatusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
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
