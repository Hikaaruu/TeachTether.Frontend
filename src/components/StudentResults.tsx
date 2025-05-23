// File: components/StudentResults.tsx
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";
import ValidationErrorList from "./ValidationErrorList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

/* ---------- props & record types ---------- */
interface Props {
  schoolId: string;
  subjectId: string;
  studentId: number;
  editable?: boolean;
}

interface Grade {
  id: number;
  gradeValue: number;
  gradeType: string;
  comment?: string;
  gradeDate: string;
}
interface Behavior {
  id: number;
  behaviorScore: number;
  comment?: string;
  behaviorDate: string;
}
interface Attendance {
  id: number;
  attendanceDate: string;
  status: string;
  comment?: string;
}

/* ---------- enums (keep UI & DTO in sync) ---------- */
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
const attendanceStatusOptions = ["Present", "Absent", "Late", "Excused"];

const dateFmt = (d: string) => dayjs(d).format("DD MMM YYYY");
const statusBadge = (s: string) =>
  ({
    Present: "bg-success",
    Absent: "bg-danger",
    Late: "bg-warning text-dark",
    Excused: "bg-info text-dark",
  }[s] ?? "bg-secondary");

/* ---------- component ---------- */
export default function StudentResults({
  schoolId,
  subjectId,
  studentId,
  editable = false,
}: Props) {
  /* ---- data state ---- */
  const navigate = useNavigate();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [behavior, setBehavior] = useState<Behavior[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [subjectName, setSubjectName] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState<string>("");
  const [delModalOpen, setDelModalOpen] = useState(false);
  const [delTarget, setDelTarget] = useState<{
    kind: FormKind;
    id: number;
  } | null>(null);
  const { user } = useAuth();

  const analyticsBasePath = user?.role.toLowerCase(); // "teacher", "guardian", etc.
  /* ---- modal state ---- */
  type FormKind = "grade" | "behavior" | "attendance";
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const [editing, setEditing] = useState<Grade | Behavior | Attendance | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);

  /* ---- fetch helpers ---- */
  const load = async () => {
    setLoading(true);
    try {
      const [g, b, a, s, studentRes] = await Promise.all([
        api.get(
          `/schools/${schoolId}/students/${studentId}/grades/subjects/${subjectId}`
        ),
        api.get(
          `/schools/${schoolId}/students/${studentId}/behavior/subjects/${subjectId}`
        ),
        api.get(
          `/schools/${schoolId}/students/${studentId}/attendance/subjects/${subjectId}`
        ),
        api.get(`/schools/${schoolId}/subjects/${subjectId}`),
        api.get(`/schools/${schoolId}/students/${studentId}`),
      ]);
      setGrades(
        [...g.data].sort(
          (x, y) => dayjs(y.gradeDate).valueOf() - dayjs(x.gradeDate).valueOf()
        )
      );
      setBehavior(
        [...b.data].sort(
          (x, y) =>
            dayjs(y.behaviorDate).valueOf() - dayjs(x.behaviorDate).valueOf()
        )
      );
      setAttendance(
        [...a.data].sort(
          (x, y) =>
            dayjs(y.attendanceDate).valueOf() -
            dayjs(x.attendanceDate).valueOf()
        )
      );
      const u = studentRes.data.user;
      setStudentName(
        [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ")
      );

      setSubjectName(s.data.name ?? s.data.Name ?? "");
    } catch {
      setGrades([]);
      setBehavior([]);
      setAttendance([]);
      setSubjectName("");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (studentId && subjectId) load();
  }, [studentId, subjectId]);

  /* ---------- modal open helpers ---------- */
  const openCreate = (kind: FormKind) => {
    setErrors([]);
    setEditing(null);
    setFormKind(kind);
    setFormOpen(true);
  };
  const openEdit = (kind: FormKind, item: any) => {
    setErrors([]);
    setEditing(item);
    setFormKind(kind);
    setFormOpen(true);
  };

  /* ---------- modal submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    let apiCall: Promise<any>;
    if (formKind === "grade") {
      const base = {
        subjectId: +subjectId,
        gradeValue: +(e.target as any).gradeValue.value,
        gradeType: (e.target as any).gradeType.value,
        comment: (e.target as any).comment.value.trim() || null,
      };
      const dto = editing
        ? base // update – no date
        : { ...base, gradeDate: (e.target as any).date.value }; // create
      apiCall = editing
        ? api.put(
            `/schools/${schoolId}/students/${studentId}/grades/${
              (editing as Grade).id
            }`,
            dto
          )
        : api.post(`/schools/${schoolId}/students/${studentId}/grades`, dto);
    } else if (formKind === "behavior") {
      const base = {
        subjectId: +subjectId,
        behaviorScore: +(e.target as any).behaviorScore.value,
        comment: (e.target as any).comment.value.trim() || null,
      };
      const dto = editing
        ? base
        : { ...base, behaviorDate: (e.target as any).date.value };
      apiCall = editing
        ? api.put(
            `/schools/${schoolId}/students/${studentId}/behavior/${
              (editing as Behavior).id
            }`,
            dto
          )
        : api.post(`/schools/${schoolId}/students/${studentId}/behavior`, dto);
    } else {
      const base = {
        subjectId: +subjectId,
        status: (e.target as any).status.value,
        comment: (e.target as any).comment.value.trim() || null,
      };
      const dto = editing
        ? base
        : { ...base, attendanceDate: (e.target as any).date.value };
      apiCall = editing
        ? api.put(
            `/schools/${schoolId}/students/${studentId}/attendance/${
              (editing as Attendance).id
            }`,
            dto
          )
        : api.post(
            `/schools/${schoolId}/students/${studentId}/attendance`,
            dto
          );
    }

    try {
      await apiCall;
      await load();
      setFormOpen(false);
      setEditing(null);
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save record."]
      );
    }
  };

  /* ---------- delete ---------- */
  const handleDeleteRequest = (kind: FormKind, id: number) => {
    setDelTarget({ kind, id });
    setDelModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    const urlPart =
      delTarget.kind === "grade"
        ? "grades"
        : delTarget.kind === "behavior"
        ? "behavior"
        : "attendance";

    await api.delete(
      `/schools/${schoolId}/students/${studentId}/${urlPart}/${delTarget.id}`
    );
    await load();
    setDelModalOpen(false);
    setDelTarget(null);
  };

  const cancelDelete = () => {
    setDelModalOpen(false);
    setDelTarget(null);
  };

  /* ---------- render ---------- */
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-semibold text-primary-emphasis mb-0 flex-grow-1 text-center">
          {studentName && subjectName
            ? `${studentName} – ${subjectName}`
            : "Student Results"}
        </h3>

        <button
          className="btn btn-sm btn-outline-info ms-3"
          onClick={() =>
            navigate(
              `/${analyticsBasePath}/students/${studentId}/subjects/${subjectId}/analytics`
            )
          }
        >
          Analytics
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <RecordSection
            title="Grades"
            data={grades}
            editable={editable}
            onAdd={() => openCreate("grade")}
            render={(g: Grade) => (
              <div className="w-100">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary">{g.gradeType}</span>
                    <span className="fw-semibold">{g.gradeValue}/100</span>
                  </div>
                  <small className="text-muted">{dateFmt(g.gradeDate)}</small>
                </div>
                {g.comment && (
                  <div className="text-muted small fst-italic mt-1">
                    {g.comment}
                  </div>
                )}
              </div>
            )}
            onEdit={(g) => openEdit("grade", g)}
            onDelete={(g) => handleDeleteRequest("grade", g.id)}
          />

          <RecordSection
            title="Behavior"
            data={behavior}
            editable={editable}
            onAdd={() => openCreate("behavior")}
            render={(b: Behavior) => (
              <div className="w-100">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-info text-dark">Behavior</span>
                    <span className="fw-semibold">{b.behaviorScore}/10</span>
                  </div>
                  <small className="text-muted">
                    {dateFmt(b.behaviorDate)}
                  </small>
                </div>
                {b.comment && (
                  <div className="text-muted small fst-italic mt-1">
                    {b.comment}
                  </div>
                )}
              </div>
            )}
            onEdit={(b) => openEdit("behavior", b)}
            onDelete={(b) => handleDeleteRequest("behavior", b.id)}
          />

          <RecordSection
            title="Attendance"
            data={attendance}
            editable={editable}
            onAdd={() => openCreate("attendance")}
            render={(a: Attendance) => (
              <div className="w-100">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${statusBadge(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                  <small className="text-muted">
                    {dateFmt(a.attendanceDate)}
                  </small>
                </div>
                {a.comment && (
                  <div className="text-muted small fst-italic mt-1">
                    {a.comment}
                  </div>
                )}
              </div>
            )}
            onEdit={(a) => openEdit("attendance", a)}
            onDelete={(a) => handleDeleteRequest("attendance", a.id)}
          />
        </>
      )}

      {delModalOpen && delTarget && (
        <ConfirmDeleteModal
          title="Delete Record"
          message="Are you sure you want to delete this record? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* ---------- modal ---------- */}
      {formOpen && formKind && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing ? "Edit " : "Create "}
                    {formKind.charAt(0).toUpperCase() +
                      formKind.slice(1) +
                      " Record"}
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
                  {formKind === "grade" && renderGradeForm(editing as Grade)}
                  {formKind === "behavior" &&
                    renderBehaviorForm(editing as Behavior)}
                  {formKind === "attendance" &&
                    renderAttendanceForm(editing as Attendance)}
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
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- generic record list section ---------- */
type SectionProps<T> = {
  title: string;
  data: T[];
  editable: boolean;
  onAdd: () => void;
  render: (item: T) => React.ReactNode;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
};
function RecordSection<T extends { id: number }>({
  title,
  data,
  editable,
  onAdd,
  render,
  onEdit,
  onDelete,
}: SectionProps<T>) {
  return (
    <section className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">{title}</h6>
        {editable && (
          <button className="btn btn-sm btn-outline-primary" onClick={onAdd}>
            + Add
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-muted">No records yet.</p>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: 300 }}>
          <ul className="list-group">
            {data.map((item) => (
              <li
                key={item.id}
                className="list-group-item d-flex justify-content-between align-items-start"
              >
                <div>{render(item)}</div>
                {editable && (
                  <div className="ms-2 btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => onDelete(item)}
                    >
                      Del
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ---------- modal form render helpers ---------- */
const renderGradeForm = (g?: Grade) => (
  <>
    <div className="mb-3">
      <label className="form-label">Grade Value (0-100)</label>
      <input
        name="gradeValue"
        type="number"
        className="form-control"
        defaultValue={g?.gradeValue ?? ""}
        step={0.01}
        required
      />
    </div>
    <div className="mb-3">
      <label className="form-label">Grade Type</label>
      <select
        name="gradeType"
        className="form-select"
        defaultValue={g?.gradeType ?? ""}
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
    {/* Date only when creating */}
    {!g && (
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
        defaultValue={g?.comment ?? ""}
      />
    </div>
  </>
);

const renderBehaviorForm = (b?: Behavior) => (
  <>
    <div className="mb-3">
      <label className="form-label">Behavior Score (0-10)</label>
      <input
        name="behaviorScore"
        type="number"
        className="form-control"
        defaultValue={b?.behaviorScore ?? ""}
        step={0.01}
        required
      />
    </div>
    {!b && (
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
        defaultValue={b?.comment ?? ""}
      />
    </div>
  </>
);

const renderAttendanceForm = (a?: Attendance) => (
  <>
    <div className="mb-3">
      <label className="form-label">Status</label>
      <select
        name="status"
        className="form-select"
        defaultValue={a?.status ?? ""}
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
    {!a && (
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
        defaultValue={a?.comment ?? ""}
      />
    </div>
  </>
);
