import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/" />;
  }

  // Redirect to home/login if role is unauthorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
