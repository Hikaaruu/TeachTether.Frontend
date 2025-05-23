// src/pages/owner/StudentsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import CredentialsModal from "../../components/CredentialsModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

type Student = {
  id: number;
  dateOfBirth: string;
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

type CreatedCredentials = { username: string; password: string };

export default function StudentsPage() {
  const { id: schoolId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [creds, setCreds] = useState<CreatedCredentials | null>(null);

  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadStudents = () => {
    setLoading(true);
    api
      .get<Student[]>(`/schools/${schoolId}/students`)
      .then((r) => setStudents(r.data))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };
  useEffect(loadStudents, [schoolId]);

  const openCreate = () =>
    setEditing({ firstName: "", lastName: "", sex: "M", dateOfBirth: "" });

  const openEdit = (s: Student) =>
    setEditing({
      id: s.id,
      firstName: s.user.firstName,
      middleName: s.user.middleName,
      lastName: s.user.lastName,
      sex: s.user.sex as "M" | "F",
      dateOfBirth: s.dateOfBirth,
    });

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete || !schoolId) return;
    try {
      await api.delete(`/schools/${schoolId}/students/${studentToDelete.id}`);
      setShowDeleteModal(false);
      setStudentToDelete(null);
      loadStudents();
    } catch {
      // Optional: add toast or alert
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
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
        await api.put(`/schools/${schoolId}/students/${editing.id}`, dto);
      } else {
        const res = await api.post(`/schools/${schoolId}/students`, dto);
        setCreds({ username: res.data.username, password: res.data.password });
      }
      setFormOpen(false);
      setEditing(null);
      loadStudents();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save student."]
      );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Students</h5>
        <button
          className="btn btn-success"
          onClick={() => (setFormOpen(true), openCreate())}
        >
          + Create Student
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-muted">No students yet.</p>
      ) : (
        <ul className="list-group">
          {students.map((s) => (
            <li
              key={s.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                {s.user.firstName}{" "}
                {s.user.middleName && s.user.middleName + " "} {s.user.lastName}
              </div>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => (setFormOpen(true), openEdit(s))}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteClick(s)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ----- Create / Edit Modal ----- */}
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
                    {editing.id ? "Edit Student" : "Create Student"}
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

      {/* ----- Credentials Modal ----- */}
      {creds && (
        <CredentialsModal
          username={creds.username}
          password={creds.password}
          onClose={() => setCreds(null)}
        />
      )}

      {/* ----- Delete Confirmation Modal ----- */}
      {showDeleteModal && studentToDelete && (
        <ConfirmDeleteModal
          title="Delete Student"
          message={`Are you sure you want to delete student "${studentToDelete.user.firstName} ${studentToDelete.user.lastName}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
