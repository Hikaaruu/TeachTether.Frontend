import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

type School = {
  id: number;
  name: string;
};

export default function SchoolsPage() {
  const navigate = useNavigate();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState<number | null>(null);
  const [creatingOrUpdating, setCreatingOrUpdating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadSchools = () => {
    setLoading(true);
    api
      .get<School[]>("/schools")
      .then((res) => setSchools(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const openCreateModal = () => {
    setFormId(null);
    setFormName("");
    setErrors([]);
    setShowCreateModal(true);
  };

  const openEditModal = (school: School) => {
    setFormId(school.id);
    setFormName(school.name);
    setErrors([]);
    setShowEditModal(true);
  };

  const openDeleteModal = (school: School) => {
    setSchoolToDelete(school);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    try {
      await api.delete(`/schools/${schoolToDelete.id}`);
      setShowDeleteModal(false);
      setSchoolToDelete(null);
      loadSchools();
    } catch {}
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSchoolToDelete(null);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreatingOrUpdating(true);
    setErrors([]);
    try {
      await api.post("/schools", { name: formName.trim() });
      setShowCreateModal(false);
      loadSchools();
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      setErrors(
        apiErrors
          ? (Object.values(apiErrors).flat() as string[])
          : ["Failed to create school."]
      );
    } finally {
      setCreatingOrUpdating(false);
    }
  };

  const handleEdit = async () => {
    if (!formId || !formName.trim()) return;
    setCreatingOrUpdating(true);
    setErrors([]);
    try {
      await api.put(`/schools/${formId}`, { name: formName.trim() });
      setShowEditModal(false);
      loadSchools();
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      setErrors(
        apiErrors
          ? (Object.values(apiErrors).flat() as string[])
          : ["Failed to update school."]
      );
    } finally {
      setCreatingOrUpdating(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">My Schools</h4>
        <button className="btn btn-success" onClick={openCreateModal}>
          + Create School
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : schools.length === 0 ? (
        <p className="text-muted">You don’t have any schools yet.</p>
      ) : (
        <ul className="list-group">
          {schools.map((school) => (
            <li
              key={school.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span
                style={{ cursor: "pointer", textDecoration: "none" }}
                onClick={() => navigate(`/owner/schools/${school.id}`)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
                {school.name}
              </span>

              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => openEditModal(school)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => openDeleteModal(school)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreateModal && (
        <SchoolModal
          title="Create School"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          name={formName}
          setName={setFormName}
          loading={creatingOrUpdating}
          errors={errors}
        />
      )}

      {showEditModal && (
        <SchoolModal
          title="Edit School"
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
          name={formName}
          setName={setFormName}
          loading={creatingOrUpdating}
          errors={errors}
        />
      )}

      {showDeleteModal && schoolToDelete && (
        <ConfirmDeleteModal
          title="Delete School"
          message={`Are you sure you want to delete school "${schoolToDelete.name}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

type ModalProps = {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  name: string;
  setName: (v: string) => void;
  loading: boolean;
  errors: string[];
};

function SchoolModal({
  title,
  onClose,
  onSubmit,
  name,
  setName,
  loading,
  errors,
}: ModalProps) {
  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <label className="form-label">School Name</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <ValidationErrorList messages={errors} />
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={loading || !name.trim()}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
