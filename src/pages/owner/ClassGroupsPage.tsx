import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import { useNavigate } from "react-router-dom";

type Teacher = {
  id: number;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
};

type ClassGroup = {
  id: number;
  gradeYear: number;
  section: string;
  homeroomTeacherId: number;
};

type FormState = {
  id?: number;
  gradeYear: number;
  section: string;
  homeroomTeacherId: number;
};

export default function ClassGroupsPage() {
  const { id: schoolId } = useParams();
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [cgRes, tRes] = await Promise.all([
          api.get(`/schools/${schoolId}/classgroups`),
          api.get(`/schools/${schoolId}/teachers`),
        ]);
        setClassGroups(cgRes.data);
        setTeachers(tRes.data);
      } catch {
        setClassGroups([]);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [schoolId]);

  const openCreate = () =>
    setEditing({ gradeYear: 1, section: "", homeroomTeacherId: 0 });

  const openEdit = (c: ClassGroup) =>
    setEditing({
      id: c.id,
      gradeYear: c.gradeYear,
      section: c.section,
      homeroomTeacherId: c.homeroomTeacherId,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const dto = {
      gradeYear: editing!.gradeYear,
      section: editing!.section.trim(),
      homeroomTeacherId: editing!.homeroomTeacherId,
    };

    try {
      if (editing?.id) {
        await api.put(`/schools/${schoolId}/classgroups/${editing.id}`, dto);
      } else {
        await api.post(`/schools/${schoolId}/classgroups`, dto);
      }
      setFormOpen(false);
      setEditing(null);
      const res = await api.get(`/schools/${schoolId}/classgroups`);
      setClassGroups(res.data);
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save class group."]
      );
    }
  };

  const teacherLabel = (id: number) => {
    const t = teachers.find((t) => t.id === id);
    if (!t) return "Unknown";
    const { firstName, middleName, lastName } = t.user;
    return [firstName, middleName, lastName].filter(Boolean).join(" ");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Class Groups</h5>
        <button
          className="btn btn-success"
          onClick={() => (setFormOpen(true), openCreate())}
        >
          + Create Group
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : classGroups.length === 0 ? (
        <p className="text-muted">No class groups yet.</p>
      ) : (
        <ul className="list-group">
          {classGroups.map((c) => (
            <li
              key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span
                style={{ cursor: "pointer", textDecoration: "none" }}
                onClick={() => navigate(`${c.id}`)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
                Grade {c.gradeYear}-{c.section} (Homeroom:{" "}
                {teacherLabel(c.homeroomTeacherId)})
              </span>

              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => (setFormOpen(true), openEdit(c))}
                >
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-danger" disabled>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
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
                    {editing.id ? "Edit Class Group" : "Create Class Group"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => (setFormOpen(false), setEditing(null))}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Grade Year</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editing.gradeYear}
                      onChange={(e) =>
                        setEditing((a) => ({
                          ...a!,
                          gradeYear: +e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Section (e.g. A, B, C)</label>
                    <input
                      className="form-control"
                      value={editing.section}
                      onChange={(e) =>
                        setEditing((a) => ({ ...a!, section: e.target.value }))
                      }
                      required
                      maxLength={1}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Homeroom Teacher</label>
                    <select
                      className="form-select"
                      value={editing.homeroomTeacherId}
                      onChange={(e) =>
                        setEditing((a) => ({
                          ...a!,
                          homeroomTeacherId: parseInt(e.target.value),
                        }))
                      }
                      required
                    >
                      <option value="">-- Select Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {teacherLabel(t.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ValidationErrorList messages={errors} />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => (setFormOpen(false), setEditing(null))}
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
