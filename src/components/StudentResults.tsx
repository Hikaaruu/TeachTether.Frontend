import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { api } from "../api/client";
import ValidationErrorList from "./ValidationErrorList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

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
  teacherName: string;
}
interface Behavior {
  id: number;
  behaviorScore: number;
  comment?: string;
  behaviorDate: string;
  teacherName: string;
}
interface Attendance {
  id: number;
  attendanceDate: string;
  status: string;
  comment?: string;
  teacherName: string;
}

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
  })[s] ?? "bg-secondary";

export default function StudentResults({
  schoolId,
  subjectId,
  studentId,
  editable = false,
}: Props) {
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

  const analyticsBasePath = user?.role.toLowerCase();
  type FormKind = "grade" | "behavior" | "attendance";
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const [editing, setEditing] = useState<Grade | Behavior | Attendance | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      const form = e.target as any;
      let res: any;
      let saved: Grade | Behavior | Attendance;

      if (formKind === "grade") {
        const base = {
          subjectId: +subjectId,
          gradeValue: +form.gradeValue.value,
          gradeType: form.gradeType.value,
          comment: form.comment.value.trim() || null,
        };
        const dto = editing ? base : { ...base, gradeDate: form.date.value };

        res = editing
          ? await api.put(
              `/schools/${schoolId}/students/${studentId}/grades/${
                (editing as Grade).id
              }`,
              dto
            )
          : await api.post(
              `/schools/${schoolId}/students/${studentId}/grades`,
              dto
            );

        const returned = res.data as Grade;
        const saved: Grade =
          returned && typeof returned.id === "number"
            ? returned
            : {
                ...(editing as Grade),
                ...dto,
                id: (editing as Grade).id,
                gradeDate: (editing as Grade).gradeDate,
              };

        setGrades((curr) => {
          const arr = editing
            ? curr.map((g) => (g.id === saved.id ? (saved as Grade) : g))
            : [saved as Grade, ...curr];
          return arr.sort(
            (a, b) =>
              dayjs((b as Grade).gradeDate).valueOf() -
              dayjs((a as Grade).gradeDate).valueOf()
          );
        });
      } else if (formKind === "behavior") {
        const base = {
          subjectId: +subjectId,
          behaviorScore: +form.behaviorScore.value,
          comment: form.comment.value.trim() || null,
        };
        const dto = editing ? base : { ...base, behaviorDate: form.date.value };

        res = editing
          ? await api.put(
              `/schools/${schoolId}/students/${studentId}/behavior/${
                (editing as Behavior).id
              }`,
              dto
            )
          : await api.post(
              `/schools/${schoolId}/students/${studentId}/behavior`,
              dto
            );

        const returnedB = res.data as Behavior;
        const savedB: Behavior =
          returnedB && typeof returnedB.id === "number"
            ? returnedB
            : {
                ...(editing as Behavior),
                ...dto,
                id: (editing as Behavior).id,
                behaviorDate: (editing as Behavior).behaviorDate,
              };

        setBehavior((curr) => {
          const arr = editing
            ? curr.map((b) => (b.id === savedB.id ? (savedB as Behavior) : b))
            : [savedB as Behavior, ...curr];
          return arr.sort(
            (a, b) =>
              dayjs((b as Behavior).behaviorDate).valueOf() -
              dayjs((a as Behavior).behaviorDate).valueOf()
          );
        });
      } else {
        const base = {
          subjectId: +subjectId,
          status: form.status.value,
          comment: form.comment.value.trim() || null,
        };
        const dto = editing
          ? base
          : { ...base, attendanceDate: form.date.value };

        res = editing
          ? await api.put(
              `/schools/${schoolId}/students/${studentId}/attendance/${
                (editing as Attendance).id
              }`,
              dto
            )
          : await api.post(
              `/schools/${schoolId}/students/${studentId}/attendance`,
              dto
            );

        const returnedA = res.data as Attendance;
        const savedA: Attendance =
          returnedA && typeof returnedA.id === "number"
            ? returnedA
            : {
                ...(editing as Attendance),
                ...dto,
                id: (editing as Attendance).id,
                attendanceDate: (editing as Attendance).attendanceDate,
              };

        setAttendance((curr) => {
          const arr = editing
            ? curr.map((a) => (a.id === savedA.id ? (savedA as Attendance) : a))
            : [savedA as Attendance, ...curr];
          return arr.sort(
            (a, b) =>
              dayjs((b as Attendance).attendanceDate).valueOf() -
              dayjs((a as Attendance).attendanceDate).valueOf()
          );
        });
      }

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

  const handleDeleteRequest = (kind: FormKind, id: number) => {
    setDelTarget({ kind, id });
    setDelModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!delTarget) return;

    const { kind, id } = delTarget;
    const urlPart =
      kind === "grade"
        ? "grades"
        : kind === "behavior"
          ? "behavior"
          : "attendance";

    try {
      await api.delete(
        `/schools/${schoolId}/students/${studentId}/${urlPart}/${id}`
      );

      if (kind === "grade") {
        setGrades((curr) => curr.filter((g) => g.id !== id));
      } else if (kind === "behavior") {
        setBehavior((curr) => curr.filter((b) => b.id !== id));
      } else {
        setAttendance((curr) => curr.filter((a) => a.id !== id));
      }
    } catch (err: any) {
      console.error("Delete failed", err);
      setErrors(["Failed to delete record."]);
    } finally {
      setDelModalOpen(false);
      setDelTarget(null);
    }
  };

  const cancelDelete = () => {
    setDelModalOpen(false);
    setDelTarget(null);
  };

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
                <div className="d-flex align-items-center">
                  <span
                    className={`badge ${statusBadge(a.status)} flex-shrink-0`}
                  >
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
                <div
                  className="flex-grow-1 overflow-hidden"
                  style={{ minWidth: 0 }}
                >
                  {render(item)}
                </div>
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
