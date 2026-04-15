import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import ValidationErrorList from "../../components/ValidationErrorList";
import CredentialsModal from "../../components/CredentialsModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { extractApiErrors } from "../../utils/errors";
import { SchoolAdmin, CreatedCredentials } from "../../types/models";
import { compareByPersonName } from "../../utils/format";

type FormState = {
  id?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  sex: "M" | "F";
};

export default function AdminsPage() {
  const { id: schoolId } = useParams();
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<FormState | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [createdCredentials, setCreatedCredentials] =
    useState<CreatedCredentials | null>(null);

  const [adminToDelete, setAdminToDelete] = useState<SchoolAdmin | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get<SchoolAdmin[]>(
        `/schools/${schoolId}/schooladmins`,
      );
      setAdmins(res.data.sort(compareByPersonName));
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [schoolId]);

  const handleEdit = (admin: SchoolAdmin) => {
    setEditingAdmin({
      id: admin.id,
      firstName: admin.user.firstName,
      middleName: admin.user.middleName,
      lastName: admin.user.lastName,
      sex: admin.user.sex as "M" | "F",
    });
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAdmin({
      firstName: "",
      lastName: "",
      sex: "M",
    });
    setFormOpen(true);
  };

  const handleDeleteClick = (admin: SchoolAdmin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete || !schoolId) return;
    try {
      await api.delete(`/schools/${schoolId}/schooladmins/${adminToDelete.id}`);
      setAdmins((curr) => curr.filter((a) => a.id !== adminToDelete.id));
    } catch {
    } finally {
      setShowDeleteModal(false);
      setAdminToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setValidationErrors([]);

    const trimmedMiddleName = editingAdmin!.middleName?.trim() || undefined;
    const dto = {
      user: {
        firstName: editingAdmin!.firstName.trim(),
        lastName: editingAdmin!.lastName.trim(),
        sex: editingAdmin!.sex,
        ...(trimmedMiddleName && { middleName: trimmedMiddleName }),
      },
    };

    try {
      if (editingAdmin?.id) {
        await api.put(
          `/schools/${schoolId}/schooladmins/${editingAdmin.id}`,
          dto,
        );

        const original = admins.find((a) => a.id === editingAdmin.id)!;
        const updated: SchoolAdmin = {
          ...original,
          user: {
            ...original.user,
            firstName: dto.user.firstName,
            middleName: trimmedMiddleName,
            lastName: dto.user.lastName,
            sex: dto.user.sex,
          },
        };

        setAdmins((curr) =>
          curr
            .map((a) => (a.id === updated.id ? updated : a))
            .sort(compareByPersonName),
        );

        setFormOpen(false);
      } else {
        const res = await api.post<{
          id: number;
          username: string;
          password: string;
          user: SchoolAdmin["user"];
        }>(`/schools/${schoolId}/schooladmins`, dto);

        setCreatedCredentials({
          username: res.data.username,
          password: res.data.password,
        });

        const created: SchoolAdmin = {
          id: res.data.id,
          user: res.data.user,
        };

        setAdmins((curr) => [created, ...curr].sort(compareByPersonName));
        setFormOpen(false);
      }
    } catch (err: unknown) {
      setValidationErrors(extractApiErrors(err, "Failed to save admin."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">School Admins</h5>
        <button className="btn btn-success" onClick={handleCreate}>
          + Create Admin
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : admins.length === 0 ? (
        <p className="text-muted">No admins yet.</p>
      ) : (
        <ul className="list-group">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div
                className="flex-grow-1 me-3 text-truncate"
                style={{ minWidth: 0 }}
              >
                {admin.user.firstName}{" "}
                {admin.user.middleName && admin.user.middleName + " "}
                {admin.user.lastName}
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleEdit(admin)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteClick(admin)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingAdmin?.id ? "Edit Admin" : "Create Admin"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setFormOpen(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input
                      className="form-control"
                      required
                      value={editingAdmin?.firstName || ""}
                      onChange={(e) =>
                        setEditingAdmin((a) => ({
                          ...a!,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Middle Name (optional)</label>
                    <input
                      className="form-control"
                      value={editingAdmin?.middleName || ""}
                      onChange={(e) =>
                        setEditingAdmin((a) => ({
                          ...a!,
                          middleName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      className="form-control"
                      required
                      value={editingAdmin?.lastName || ""}
                      onChange={(e) =>
                        setEditingAdmin((a) => ({
                          ...a!,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Sex</label>
                    <select
                      className="form-select"
                      value={editingAdmin?.sex || "M"}
                      onChange={(e) =>
                        setEditingAdmin((a) => ({
                          ...a!,
                          sex: e.target.value as "M" | "F",
                        }))
                      }
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <ValidationErrorList messages={validationErrors} />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFormOpen(false)}
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

      {createdCredentials && (
        <CredentialsModal
          username={createdCredentials.username}
          password={createdCredentials.password}
          onClose={() => setCreatedCredentials(null)}
        />
      )}

      {showDeleteModal && adminToDelete && (
        <ConfirmDeleteModal
          title="Delete Admin"
          message={`Are you sure you want to delete admin "${adminToDelete.user.firstName} ${adminToDelete.user.lastName}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
