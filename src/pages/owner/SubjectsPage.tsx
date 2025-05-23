import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

type Subject = {
  id: number;
  name: string;
};

type FormState = {
  id?: number;
  name: string;
};

export default function SubjectsPage() {
  const { id: schoolId } = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadSubjects = () => {
    setLoading(true);
    api
      .get<Subject[]>(`/schools/${schoolId}/subjects`)
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadSubjects, [schoolId]);

  const openCreate = () => setEditing({ name: "" });
  const openEdit = (s: Subject) => setEditing({ id: s.id, name: s.name });

  const handleDeleteClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete || !schoolId) return;
    try {
      await api.delete(`/schools/${schoolId}/subjects/${subjectToDelete.id}`);
      setSubjectToDelete(null);
      setShowDeleteModal(false);
      loadSubjects();
    } catch {
      alert("Failed to delete subject. It may be in use.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSubjectToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const dto = { name: editing!.name.trim() };
    try {
      if (editing?.id) {
        await api.put(`/schools/${schoolId}/subjects/${editing.id}`, dto);
      } else {
        await api.post(`/schools/${schoolId}/subjects`, dto);
      }
      setFormOpen(false);
      setEditing(null);
      loadSubjects();
    } catch (err: any) {
      const apiErr = err?.response?.data?.errors;
      setErrors(
        apiErr && typeof apiErr === "object"
          ? (Object.values(apiErr).flat() as string[])
          : ["Failed to save subject."]
      );
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Subjects</h5>
        <button
          className="btn btn-success"
          onClick={() => (setFormOpen(true), openCreate())}
        >
          + Create Subject
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : subjects.length === 0 ? (
        <p className="text-muted">No subjects yet.</p>
      ) : (
        <ul className="list-group">
          {subjects.map((s) => (
            <li
              key={s.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>{s.name}</div>
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
                    {editing.id ? "Edit Subject" : "Create Subject"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => (setFormOpen(false), setEditing(null))}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      required
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev!,
                          name: e.target.value,
                        }))
                      }
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

      {showDeleteModal && subjectToDelete && (
        <ConfirmDeleteModal
          title="Delete Subject"
          message={`Are you sure you want to delete subject "${subjectToDelete.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
