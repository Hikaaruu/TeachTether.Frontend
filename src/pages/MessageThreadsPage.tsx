import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

type Thread = {
  id: number;
  teacherId: number;
  guardianId: number;
};

type Teacher = {
  id: number;
  user: { firstName: string; middleName?: string; lastName: string };
};

type Guardian = {
  id: number;
  user: { firstName: string; middleName?: string; lastName: string };
};

type UserKind = "Teacher" | "Guardian";

const fullName = (u: {
  firstName: string;
  middleName?: string;
  lastName: string;
}) => [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ");

export default function MessageThreadsPage() {
  const { user } = useAuth();
  const role: UserKind = user?.role === "Teacher" ? "Teacher" : "Guardian";
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [companions, setCompanions] = useState<(Teacher | Guardian)[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const tRes = await api.get<Thread[]>("/threads");
        setThreads(tRes.data);

        if (role === "Guardian") {
          const res = await api.get<Teacher[]>("/guardians/me/teachers");
          setCompanions(res.data);
        } else {
          const res = await api.get<Guardian[]>("/teachers/me/guardians");
          setCompanions(res.data);
        }
      } catch {
        setThreads([]);
        setCompanions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  const companionMap = useMemo(() => {
    const map = new Map<number, string>();
    companions.forEach((c) => map.set(c.id, fullName(c.user)));
    return map;
  }, [companions]);

  const available = useMemo(() => {
    const takenIds = new Set<number>(
      threads.map((t) => (role === "Guardian" ? t.teacherId : t.guardianId))
    );
    return companions.filter((c) => !takenIds.has(c.id));
  }, [companions, threads, role]);

  const handleCreate = async () => {
    if (!selectedId) return;
    setSaving(true);

    try {
      const payload =
        role === "Guardian"
          ? { teacherId: selectedId, guardianId: user?.entityId }
          : { guardianId: selectedId, teacherId: user?.entityId };

      const res = await api.post<Thread>("/threads", payload);
      const created = res.data;

      setThreads((curr) => [...curr, created]);

      setFormOpen(false);
      setSelectedId("");
    } catch (err) {
      console.error("Create thread failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = (thread: Thread) => {
    setThreadToDelete(thread);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!threadToDelete) return;

    try {
      await api.delete(`/threads/${threadToDelete.id}`);

      setThreads((curr) => curr.filter((t) => t.id !== threadToDelete.id));
    } catch (err) {
      console.error("Delete thread failed", err);
    } finally {
      setShowDeleteModal(false);
      setThreadToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setThreadToDelete(null);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Chats</h5>
        <button
          className="btn btn-success"
          onClick={() => setFormOpen(true)}
          disabled={available.length === 0}
        >
          + New Thread
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : threads.length === 0 ? (
        <p className="text-muted">No threads yet.</p>
      ) : (
        <ul className="list-group">
          {threads.map((t) => {
            const companionId =
              role === "Guardian" ? t.teacherId : t.guardianId;
            const compName = companionMap.get(companionId) ?? "Unknown";
            const compRole = role === "Guardian" ? "Teacher" : "Guardian";
            return (
              <li
                key={t.id}
                role="button"
                className="list-group-item d-flex justify-content-between align-items-center"
                onClick={() => navigate(`${t.id}/messages`)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.textDecoration = "underline")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.textDecoration = "none")
                }
              >
                <span>
                  {compRole}: {compName}
                </span>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(t);
                  }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {formOpen && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000066" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Start New Conversation</h5>
                <button
                  className="btn-close"
                  onClick={() => setFormOpen(false)}
                />
              </div>
              <div className="modal-body">
                {available.length === 0 ? (
                  <p className="text-muted">
                    You already have threads with all eligible users.
                  </p>
                ) : (
                  <>
                    <label className="form-label">
                      Select {role === "Guardian" ? "Teacher" : "Guardian"}
                    </label>
                    <select
                      className="form-select"
                      value={selectedId}
                      onChange={(e) =>
                        setSelectedId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    >
                      <option value="">-- choose --</option>
                      {available.map((c) => (
                        <option key={c.id} value={c.id}>
                          {fullName(c.user)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={!selectedId || saving}
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && threadToDelete && (
        <ConfirmDeleteModal
          title="Delete Conversation"
          message="Are you sure you want to delete this conversation? This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
