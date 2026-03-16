// ⚠️ AUTH TEMPORARILY DISABLED FOR LOCAL DEV — re-enable before deploying!
function ProtectedRoute({ children, allowedRoles }) {
  // TODO: Re-enable auth checks before pushing to production
  // const token = localStorage.getItem("token");
  // const role = localStorage.getItem("role");
  // if (!token) return <Navigate to="/" />;
  // if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;
  return children;
}

export default ProtectedRoute;
