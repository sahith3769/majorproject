import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  // Helper to check if we are on auth pages
  const isAuthPage = ["/", "/register", "/verify-otp"].includes(location.pathname);

  if (isAuthPage) return null; // Hide on login/register/verify-otp

  if (!role) return null; // Hide if not logged in

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-top">MRU</div>
        <div className="brand-bottom">CSE PLACEMENT PORTAL</div>
      </div>

      <div className="nav-links">


        {role && (
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        )}
      </div>
    </header>
  );
}



export default Navbar;
