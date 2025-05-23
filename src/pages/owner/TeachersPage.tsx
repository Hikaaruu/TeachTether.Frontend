import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import CredentialsModal from "../../components/CredentialsModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

type Teacher = {
  id: number;
  dateOfBirth: string; // "YYYY-MM-DD"
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
    sex: string;
  };
};

type FormState = {
  id?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  sex: "M" | "F";
  dateOfBirth: string;
};

type CreatedCredentials = {
  username: string;
  password: string;
};

export default function TeachersPage() {
  const { id: schoolId } = useParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [creds, setCreds] = useState<CreatedCredentials | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadTeachers = () => {
    setLoading(true);
    api
      .get<Teacher[]>(`/schools/${schoolId}/teachers`)
      .then((r) => setTeachers(r.data))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadTeachers, [schoolId]);

  const openCreate = () =>
    setEditing({ firstName: "", lastName: "", sex: "M", dateOfBirth: "" });

  const openEdit = (t: Teacher) =>
    setEditing({
      id: t.id,
      firstName: t.user.firstName,
      middleName: t.user.middleName,
      lastName: t.user.lastName,
      sex: t.user.sex as "M" | "F",
      dateOfBirth: t.dateOfBirth,
    });

  const handleDeleteClick = (teacher: Teacher) => {
    setDeleteError(null); // clear previous error
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete || !schoolId) return;
    try {
      await api.delete(`/schools/${schoolId}/teachers/${teacherToDelete.id}`);
      setShowDeleteModal(false);
      setTeacherToDelete(null);
      setDeleteError(null); // clear any previous error
      loadTeachers();
    } catch {
      setShowDeleteModal(false);
      setDeleteError(
        `Failed to delete teacher "${teacherToDelete.user.firstName} ${teacherToDelete.user.lastName}". They are probably assigned as a homeroom teacher to a class group.`
      );
      setTeacherToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const dto = {
      user: {
        firstName: editing!.firstName.trim(),
        lastName: editing!.lastName.trim(),
        sex: editing!.sex,
        ...(editing!.middleName?.trim() && {
          middleName: editing!.middleName.trim(),
        }),
      },
      dateOfBirth: editing!.dateOfBirth,
    };

    try {
      if (editing?.id) {
        await api.put(`/schools/${schoolId}/teachers/${editing.id}`, dto);
      } else {
        const res = await api.post(`/schools/${schoolId}/teachers`, dto);
        setCreds({
          username: res.data.username,
          password: res.data.password,
        });
      }
      setFormOpen(false);
      setEditing(null);
      loadTeachers();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save teacher."]
      );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Teachers</h5>
        <button
          className="btn btn-success"
          onClick={() => (setFormOpen(true), openCreate())}
        >
          + Create Teacher
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : teachers.length === 0 ? (
        <p className="text-muted">No teachers yet.</p>
      ) : (
        <ul className="list-group">
          {teachers.map((t) => (
            <li
              key={t.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                {t.user.firstName}{" "}
                {t.user.middleName && t.user.middleName + " "}
                {t.user.lastName}
              </div>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => (setFormOpen(true), openEdit(t))}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteClick(t)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal for Create/Edit */}
      {formOpen && editing && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editing.id ? "Edit Teacher" : "Create Teacher"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => (setFormOpen(false), setEditing(null))}
                  />
                </div>
                <div className="modal-body">
                  {["First", "Middle (optional)", "Last"].map((lbl, idx) => {
                    const key = ["firstName", "middleName", "lastName"][idx] as
                      | "firstName"
                      | "middleName"
                      | "lastName";
                    return (
                      <div className="mb-3" key={key}>
                        <label className="form-label">{lbl} Name</label>
                        <input
                          className="form-control"
                          required={key !== "middleName"}
                          value={(editing as any)[key] || ""}
                          onChange={(e) =>
                            setEditing((a) => ({
                              ...a!,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}

                  <div className="mb-3">
                    <label className="form-label">Sex</label>
                    <select
                      className="form-select"
                      value={editing.sex}
                      onChange={(e) =>
                        setEditing((a) => ({
                          ...a!,
                          sex: e.target.value as "M" | "F",
                        }))
                      }
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editing.dateOfBirth}
                      onChange={(e) =>
                        setEditing((a) => ({
                          ...a!,
                          dateOfBirth: e.target.value,
                        }))
                      }
                      required
                    />
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

      {creds && (
        <CredentialsModal
          username={creds.username}
          password={creds.password}
          onClose={() => setCreds(null)}
        />
      )}

      {showDeleteModal && teacherToDelete && (
        <ConfirmDeleteModal
          title="Delete Teacher"
          message={`Are you sure you want to delete teacher "${teacherToDelete.user.firstName} ${teacherToDelete.user.lastName}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {deleteError && (
        <div className="alert alert-danger mt-3" role="alert">
          {deleteError}
        </div>
      )}
    </div>
  );
}
