import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const [isCompany, setIsCompany] = useState(false);
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await API.post("/auth/login", form);

      // Strict Role Check based on Portal Type
      if (isCompany && data.role !== "company") {
        toast.error("Access Denied: This account is not a Company account.");
        return;
      }

      if (!isCompany && data.role === "company") {
        toast.error("Access Denied: Please use the Company Portal for login.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      toast.success("Login Successful");

      if (data.role === "company") {
        navigate("/company");
      } else if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }

    } catch (error) {
      toast.error(error.response?.data?.msg || error.response?.data?.error || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isCompany ? 'company-theme' : ''}`}>
      <div className="auth-card">
        {/* Branding Header */}
        <div className="navbar-brand" style={{ position: 'relative', left: 'auto', transform: 'none', marginBottom: '20px', pointerEvents: 'auto' }}>
          <div className="brand-top" style={{ color: 'var(--primary)' }}>MRU</div>
          <div className="brand-bottom" style={{ color: 'var(--text-secondary)' }}>CSE PLACEMENT PORTAL</div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginBottom: '20px', gap: '5px' }}>
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setIsCompany(false)}
            style={{
              background: !isCompany ? 'var(--primary)' : 'transparent',
              color: !isCompany ? '#ffffff' : '#000000',
              fontWeight: !isCompany ? 'bold' : 'normal',
            }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setIsCompany(true)}
            style={{
              background: isCompany ? 'var(--primary)' : 'transparent',
              color: isCompany ? '#ffffff' : '#000000',
              fontWeight: isCompany ? 'bold' : 'normal',
            }}
          >
            🏢 Company
          </button>
        </div>

        <h2 style={{ color: '#000000', background: 'none', WebkitTextFillColor: 'initial' }}>
          {isCompany ? "Company Portal" : "Student Login"}
        </h2>
        <p className="auth-subtitle">
          {isCompany ? "Recruiter & Hiring Manager Login" : "Access your placement portal"}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={isCompany ? "Username or Work Email" : "Username or Student Email"}
            value={form.identifier}
            onChange={(e) =>
              setForm({ ...form, identifier: e.target.value })
            }
            required
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '40%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#000000',
                padding: '0 10px'
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button className="auth-secondary-btn" onClick={() => navigate("/register")}>
            Register
          </button>
        </p>


      </div>
    </div>
  );

}

export default Login;
