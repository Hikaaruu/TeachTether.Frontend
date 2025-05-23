import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import CredentialsModal from "../../components/CredentialsModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

// Types

type Guardian = {
  id: number;
  dateOfBirth: string;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
    sex: string;
  };
};

type Student = {
  id: number;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  schoolId: number;
  dateOfBirth: string;
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

export default function GuardiansPage() {
  const { id: schoolId } = useParams();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [guardianStudents, setGuardianStudents] = useState<
    Record<number, Student[]>
  >({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<
    Record<number, number | "">
  >({});

  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [creds, setCreds] = useState<CreatedCredentials | null>(null);

  const [guardianToDelete, setGuardianToDelete] = useState<Guardian | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadGuardians = async () => {
    setLoading(true);
    try {
      const [gRes, sRes] = await Promise.all([
        api.get<Guardian[]>(`/schools/${schoolId}/guardians`),
        api.get<Student[]>(`/schools/${schoolId}/students`),
      ]);
      setGuardians(gRes.data);
      setAllStudents(sRes.data);

      const all: Record<number, Student[]> = {};
      await Promise.all(
        gRes.data.map(async (g) => {
          try {
            const res = await api.get<Student[]>(
              `/schools/${schoolId}/guardians/${g.id}/students`
            );
            all[g.id] = res.data;
          } catch {
            all[g.id] = [];
          }
        })
      );
      setGuardianStudents(all);
    } catch {
      setGuardians([]);
      setAllStudents([]);
      setGuardianStudents({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => void loadGuardians(), [schoolId]);

  const openCreate = () =>
    setEditing({ firstName: "", lastName: "", sex: "M", dateOfBirth: "" });

  const openEdit = (g: Guardian) =>
    setEditing({
      id: g.id,
      firstName: g.user.firstName,
      middleName: g.user.middleName,
      lastName: g.user.lastName,
      sex: g.user.sex as "M" | "F",
      dateOfBirth: g.dateOfBirth,
    });

  const studentName = (s: Student) =>
    [s.user.firstName, s.user.middleName, s.user.lastName]
      .filter(Boolean)
      .join(" ");

  const handleAddStudent = async (guardianId: number) => {
    const studentId = selectedStudentIds[guardianId];
    if (!studentId) return;
    try {
      await api.post(`/schools/${schoolId}/guardians/${guardianId}/students`, {
        studentId,
      });
      setSelectedStudentIds((prev) => ({ ...prev, [guardianId]: "" }));
      loadGuardians();
    } catch {
      alert("Failed to assign student.");
    }
  };

  const handleRemoveStudent = async (guardianId: number, studentId: number) => {
    try {
      await api.delete(
        `/schools/${schoolId}/guardians/${guardianId}/students/${studentId}`
      );
      loadGuardians();
    } catch {
      alert("Failed to remove student.");
    }
  };

  const handleDeleteClick = (guardian: Guardian) => {
    setGuardianToDelete(guardian);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!guardianToDelete || !schoolId) return;
    try {
      await api.delete(`/schools/${schoolId}/guardians/${guardianToDelete.id}`);
      setShowDeleteModal(false);
      setGuardianToDelete(null);
      loadGuardians();
    } catch {
      alert("Failed to delete guardian.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setGuardianToDelete(null);
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
        await api.put(`/schools/${schoolId}/guardians/${editing.id}`, dto);
      } else {
        const res = await api.post(`/schools/${schoolId}/guardians`, dto);
        setCreds({ username: res.data.username, password: res.data.password });
      }
      setFormOpen(false);
      setEditing(null);
      loadGuardians();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save guardian."]
      );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Guardians</h5>
        <button
          className="btn btn-success"
          onClick={() => (setFormOpen(true), openCreate())}
        >
          + Create Guardian
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : guardians.length === 0 ? (
        <p className="text-muted">No guardians yet.</p>
      ) : (
        <ul className="list-group">
          {guardians.map((g) => (
            <li key={g.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {g.user.firstName} {g.user.middleName || ""} {g.user.lastName}
                </div>
                <div>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => (setFormOpen(true), openEdit(g))}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteClick(g)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Student assignment */}
              <div className="mt-3 ms-3">
                <div className="d-flex gap-2 mb-2">
                  <select
                    className="form-select"
                    value={selectedStudentIds[g.id] || ""}
                    onChange={(e) =>
                      setSelectedStudentIds((prev) => ({
                        ...prev,
                        [g.id]: Number(e.target.value),
                      }))
                    }
                  >
                    <option value="">-- Select student to assign --</option>
                    {allStudents
                      .filter(
                        (s) =>
                          !guardianStudents[g.id]?.some((gs) => gs.id === s.id)
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {studentName(s)}
                        </option>
                      ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddStudent(g.id)}
                    disabled={!selectedStudentIds[g.id]}
                  >
                    Add
                  </button>
                </div>

                <ul className="list-group">
                  {(guardianStudents[g.id] || []).map((s) => (
                    <li
                      key={s.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {studentName(s)}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveStudent(g.id, s.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}

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
                    {editing.id ? "Edit Guardian" : "Create Guardian"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => (setFormOpen(false), setEditing(null))}
                  />
                </div>
                <div className="modal-body">
                  {[
                    ["First", "firstName"],
                    ["Middle (optional)", "middleName"],
                    ["Last", "lastName"],
                  ].map(([lbl, key]) => (
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
                  ))}

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

      {showDeleteModal && guardianToDelete && (
        <ConfirmDeleteModal
          title="Delete Guardian"
          message={`Are you sure you want to delete guardian "${guardianToDelete.user.firstName} ${guardianToDelete.user.lastName}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
