import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light text-center">
      <div>
        <h1 className="display-4 fw-bold text-danger">404</h1>
        <p className="fs-5 text-muted mb-4">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-outline-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
