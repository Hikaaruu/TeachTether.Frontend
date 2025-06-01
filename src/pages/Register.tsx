import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useState } from "react";
import ValidationErrorList from "../components/ValidationErrorList";

type RegisterForm = {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  sex: "M" | "F";
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      setValidationErrors([]);
      const { confirmPassword, middleName, ...rest } = data;
      const dto = {
        ...rest,
        ...(middleName?.trim() && { middleName: middleName.trim() }),
      };
      await api.post("/auth/register", dto);
      await login({ username: data.userName, password: data.password });
      navigate("/");
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const allMessages = Object.values(apiErrors).flat() as string[];
        setValidationErrors(allMessages);
      } else {
        setValidationErrors(["Registration failed. Please try again."]);
      }
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light px-3">
      <div className="card shadow-sm p-4 w-100" style={{ maxWidth: "800px" }}>
        <h2 className="text-center mb-4">Register</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  className={`form-control ${
                    errors.userName ? "is-invalid" : ""
                  }`}
                  {...register("userName", { required: true })}
                />
                {errors.userName && (
                  <div className="invalid-feedback">Username is required</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  {...register("email", { required: true })}
                />
                {errors.email && (
                  <div className="invalid-feedback">Email is required</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-control ${
                    errors.password ? "is-invalid" : ""
                  }`}
                  {...register("password", { required: true })}
                />
                {errors.password && (
                  <div className="invalid-feedback">Password is required</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className={`form-control ${
                    errors.confirmPassword ? "is-invalid" : ""
                  }`}
                  {...register("confirmPassword", {
                    required: true,
                    validate: (val) =>
                      val === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">
                    {errors.confirmPassword.message}
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input
                  className={`form-control ${
                    errors.firstName ? "is-invalid" : ""
                  }`}
                  {...register("firstName", { required: true })}
                />
                {errors.firstName && (
                  <div className="invalid-feedback">First name is required</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Middle Name (optional)</label>
                <input className="form-control" {...register("middleName")} />
              </div>

              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input
                  className={`form-control ${
                    errors.lastName ? "is-invalid" : ""
                  }`}
                  {...register("lastName", { required: true })}
                />
                {errors.lastName && (
                  <div className="invalid-feedback">Last name is required</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Sex</label>
                <select
                  className={`form-select ${errors.sex ? "is-invalid" : ""}`}
                  {...register("sex", { required: true })}
                >
                  <option value="">Select...</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {errors.sex && (
                  <div className="invalid-feedback">Sex is required</div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
          <ValidationErrorList messages={validationErrors} />
        </form>

        <div className="text-center mt-3">
          <button
            type="button"
            className="btn text-secondary"
            style={{ textDecoration: "none" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
            onClick={() => navigate("/login")}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
