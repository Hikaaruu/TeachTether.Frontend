import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState } from "react";

type LoginForm = {
  username: string;
  password: string;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      navigate("/");
    } catch {
      setErrorMessage("Invalid username or password.");
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div
        className="card shadow-sm p-4"
        style={{ minWidth: "320px", maxWidth: "400px", width: "100%" }}
      >
        <h2 className="text-center mb-3">TeachTether</h2>
        <p className="text-center text-muted mb-4">
          Sign in to improve the learning experience.
        </p>

        {errorMessage && (
          <div className="alert alert-danger text-center py-2" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              {...register("username", { required: true })}
            />
            {errors.username && (
              <div className="invalid-feedback">Username is required</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              {...register("password", { required: true })}
            />
            {errors.password && (
              <div className="invalid-feedback">Password is required</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            className="btn text-secondary"
            style={{
              textDecoration: "none",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
            onClick={() => navigate("/register")}
          >
            Don’t have an account? Register
          </button>
        </div>
      </div>
    </div>
  );
}
