// File: pages/AnnouncementsPage.tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import dayjs from "dayjs";
import ValidationErrorList from "../components/ValidationErrorList";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

/* ---------- TYPES ---------- */
type Announcement = {
  id: number;
  teacherId: number;
  title: string;
  message: string;
  createdAt: string;
};

type ClassGroup = {
  id: number;
  gradeYear: number;
  section: string;
};

type FormState = {
  id?: number;
  title: string;
  message: string;
  targetAudience: "Student" | "Guardian" | "StudentAndGuardian";
  classGroupIds: number[];
};

/* ---------- GROUP CHECK ITEM ---------- */
function GroupCheck({
  group,
  checked,
  onToggle,
}: {
  group: ClassGroup;
  checked: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="form-check">
      <input
        className="form-check-input"
        type="checkbox"
        id={`cg-${group.id}`}
        checked={checked}
        onChange={() => onToggle(group.id)}
      />
      <label className="form-check-label" htmlFor={`cg-${group.id}`}>
        Grade {group.gradeYear}-{group.section}
      </label>
    </div>
  );
}

/* ---------- PAGE ---------- */
export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "Teacher";
  const teacherId = user?.entityId;

  /* state */
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [clsGroups, setClsGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* modal state */
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  /* load announcements (and groups for teachers) */
  const load = async () => {
    setLoading(true);
    try {
      const ann = await api.get<Announcement[]>("/announcements");
      setAnnouncements(
        [...ann.data].sort(
          (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        )
      );

      if (isTeacher) {
        const cg = await api.get<ClassGroup[]>("/teachers/me/classgroups");
        setClsGroups(cg.data);
      }
    } catch {
      setAnnouncements([]);
      setClsGroups([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  /* helpers */
  const openCreate = () =>
    setEditing({
      title: "",
      message: "",
      targetAudience: "Student",
      classGroupIds: [],
    });

  const openEdit = (a: Announcement) =>
    setEditing({
      id: a.id,
      title: a.title,
      message: a.message,
      targetAudience: "StudentAndGuardian", // audience can’t be changed
      classGroupIds: [], // not editable after creation
    });

  const handleDelete = async () => {
    if (deletingId == null) return;
    try {
      await api.delete(`/announcements/${deletingId}`);
      // remove from local list
      setAnnouncements((curr) => curr.filter((a) => a.id !== deletingId));
    } catch {
      alert("Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setErrors([]);

    try {
      if (editing.id) {
        // ----- EDIT -----
        // send update (no response body expected)
        await api.put(`/announcements/${editing.id}`, {
          title: editing.title.trim(),
          message: editing.message.trim(),
        });

        // find the original announcement to pull its teacherId & createdAt
        const original = announcements.find((a) => a.id === editing.id)!;

        // merge fallback: overwrite title/message, preserve everything else
        const updated: Announcement = {
          ...original,
          title: editing.title.trim(),
          message: editing.message.trim(),
        };

        // replace in state & re-sort
        setAnnouncements((curr) =>
          curr
            .map((a) => (a.id === updated.id ? updated : a))
            .sort(
              (a, b) =>
                dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
            )
        );
      } else {
        // ----- CREATE -----
        const res = await api.post<Announcement>("/announcements", {
          title: editing.title.trim(),
          message: editing.message.trim(),
          targetAudience: editing.targetAudience,
          classGroupIds: editing.classGroupIds,
        });
        const created = res.data;

        setAnnouncements((curr) =>
          [created, ...curr].sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          )
        );
      }

      setFormOpen(false);
      setEditing(null);
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save announcement."]
      );
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <h5 className="flex-grow-1 text-center mb-0">Announcements</h5>

        {isTeacher && (
          <button
            className="btn btn-success ms-2"
            onClick={() => (setFormOpen(true), openCreate())}
          >
            + Create
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : announcements.length === 0 ? (
        <p className="text-muted">No announcements.</p>
      ) : (
        <ul className="list-group">
          {announcements.map((a) => (
            <li
              key={a.id}
              /* gap-3 just adds a little breathing room between the two columns */
              className="list-group-item d-flex align-items-start gap-3"
            >
              {/* ---------- text column ---------- */}
              <div className="flex-grow-1 text-break" style={{ minWidth: 0 }}>
                <div className="fw-semibold">{a.title}</div>
                <small className="text-muted">
                  {dayjs(a.createdAt).format("DD MMM YYYY HH:mm")}
                </small>
                <p className="mb-1 mt-2">{a.message}</p>
              </div>

              {/* ---------- actions ---------- */}
              {isTeacher && a.teacherId === teacherId && (
                <div className="d-flex flex-column gap-1 align-items-end flex-shrink-0">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => (setFormOpen(true), openEdit(a))}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setDeletingId(a.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deletingId !== null && (
        <ConfirmDeleteModal
          title="Delete Announcement"
          message="Are you sure you want to permanently delete this announcement?"
          onCancel={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ---------- Modal ---------- */}
      {formOpen && editing && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing.id ? "Edit Announcement" : "Create Announcement"}
                  </h5>
                  <button
                    className="btn-close"
                    type="button"
                    onClick={() => (setFormOpen(false), setEditing(null))}
                  />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={editing.title}
                      maxLength={100}
                      onChange={(e) =>
                        setEditing((f) => ({ ...f!, title: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      value={editing.message}
                      rows={4}
                      onChange={(e) =>
                        setEditing((f) => ({ ...f!, message: e.target.value }))
                      }
                      required
                    />
                  </div>

                  {!editing.id && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Target Audience</label>
                        <select
                          className="form-select"
                          value={editing.targetAudience}
                          onChange={(e) =>
                            setEditing((f) => ({
                              ...f!,
                              targetAudience: e.target.value as any,
                            }))
                          }
                          required
                        >
                          <option value="Student">Students</option>
                          <option value="Guardian">Guardians</option>
                          <option value="StudentAndGuardian">
                            Students & Guardians
                          </option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          Class Groups (at least one)
                        </label>
                        <div className="border rounded p-2">
                          {clsGroups.map((g) => (
                            <GroupCheck
                              key={g.id}
                              group={g}
                              checked={editing.classGroupIds.includes(g.id)}
                              onToggle={(id) =>
                                setEditing((f) => {
                                  const list = f!.classGroupIds;
                                  return list.includes(id)
                                    ? {
                                        ...f!,
                                        classGroupIds: list.filter(
                                          (x) => x !== id
                                        ),
                                      }
                                    : {
                                        ...f!,
                                        classGroupIds: [...list, id],
                                      };
                                })
                              }
                            />
                          ))}
                          {clsGroups.length === 0 && (
                            <p className="text-muted small mb-0">
                              No available class groups.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <ValidationErrorList messages={errors} />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => (setFormOpen(false), setEditing(null))}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="submit">
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
