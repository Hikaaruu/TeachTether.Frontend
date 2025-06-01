import { useAuth } from "../auth/AuthProvider";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">My Profile</h4>
            <span className="badge bg-primary text-uppercase">{user.role}</span>
          </div>

          <hr />

          <div className="row gy-3">
            <div className="col-md-6">
              <label className="form-label text-muted mb-0">First Name</label>
              <div className="fw-semibold">{user.firstName}</div>
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted mb-0">Username</label>
              <div className="fw-semibold">{user.userName}</div>
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted mb-0">Last Name</label>
              <div className="fw-semibold">{user.lastName}</div>
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted mb-0">Sex</label>
              <div className="fw-semibold">
                {user.sex === "M" ? "Male" : "Female"}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted mb-0">Middle Name</label>
              <div className="fw-semibold">
                {user.middleName || (
                  <span className="text-muted">Not provided</span>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted mb-0">Email</label>
              <div className="fw-semibold">
                {user.email || <span className="text-muted">Not provided</span>}
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="text-end">
            <button className="btn btn-outline-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
