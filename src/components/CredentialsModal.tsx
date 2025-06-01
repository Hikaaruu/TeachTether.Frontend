import { useState } from "react";

type Props = {
  username: string;
  password: string;
  onClose: () => void;
};

export default function CredentialsModal({
  username,
  password,
  onClose,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ background: "#00000066" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Credentials</h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body text-center">
            <div className="mb-3">
              <label className="form-label w-100 text-center">Username</label>
              <div className="d-flex">
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  value={username}
                />
                <button
                  className="btn btn-outline-secondary ms-2"
                  type="button"
                  onClick={() => copy(username)}
                  title="Copy Username"
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label w-100 text-center">Password</label>
              <div className="d-flex">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  readOnly
                  value={password}
                  style={{ flexGrow: 1 }}
                />
                <button
                  className="btn btn-outline-secondary ms-2"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
                <button
                  className="btn btn-outline-secondary ms-2"
                  type="button"
                  onClick={() => copy(password)}
                  title="Copy Password"
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>
            </div>

            <button
              className="btn btn-outline-dark btn-sm mb-3"
              onClick={() =>
                copy(`Username: ${username}\nPassword: ${password}`)
              }
            >
              <i className="bi bi-clipboard-check me-1"></i> Copy All
            </button>

            <p className="text-muted mb-0 small">
              Copy these credentials now — they won’t be shown again.
            </p>
          </div>

          <div className="modal-footer">
            <button className="btn btn-primary w-100" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
