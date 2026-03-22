import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

function Register() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        skills: [], // Skills will be added via resume analysis after login
      };

      await API.post("/auth/register", payload);

      toast.success("OTP sent to email! Please verify.");
      navigate("/verify-otp", { state: { email: form.email } });

    } catch (error) {
      toast.error(error.response?.data?.msg || error.response?.data?.error || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${form.role === 'company' ? 'company-theme' : ''}`}>
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Branding Header */}
        <div className="navbar-brand" style={{ position: 'relative', left: 'auto', transform: 'none', marginBottom: '20px', pointerEvents: 'auto' }}>
          <div className="brand-top" style={{ color: 'var(--primary)' }}>MRU</div>
          <div className="brand-bottom" style={{ color: 'var(--text-secondary)' }}>CSE PLACEMENT PORTAL</div>
        </div>

        {/* Tab Switcher (Matches Login Style) */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginBottom: '25px', gap: '5px' }}>
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setForm({ ...form, role: "student" })}
            style={{
              background: form.role === 'student' ? 'var(--primary)' : 'transparent',
              color: form.role === 'student' ? '#ffffff' : '#000000',
              fontWeight: form.role === 'student' ? 'bold' : 'normal',
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setForm({ ...form, role: "company" })}
            style={{
              background: form.role === 'company' ? 'var(--primary)' : 'transparent',
              color: form.role === 'company' ? '#ffffff' : '#000000',
              fontWeight: form.role === 'company' ? 'bold' : 'normal',
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🏢 Company
          </button>
        </div>

        <h2 style={{ color: '#000000', background: 'none', WebkitTextFillColor: 'initial', marginBottom: '5px' }}>
          {form.role === "company" ? "Company Registration" : "Student Registration"}
        </h2>
        <p className="auth-subtitle" style={{ marginBottom: '25px' }}>
          {form.role === "company" ? "Register your organization to hire top talent." : "Create your portal account."}
        </p>

        <form onSubmit={handleSubmit}>
          {/* THE FIX: Name field is now permanently visible for both roles! */}
          <input
            type="text"
            placeholder={form.role === "company" ? "Company Name (e.g., Google)" : "Full Name"}
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder={form.role === "company" ? "Recruiter Handle (Unique Username)" : "Username (Unique)"}
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder={form.role === "company" ? "Corporate Email" : "Student Email"}
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
              style={{ paddingRight: '50px', marginBottom: '0' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--primary)',
                padding: '5px'
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <motion.button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? "Registering..." : "Register Account"}
          </motion.button>
        </form>

        <p className="auth-footer" style={{ marginTop: '20px' }}>
          Already have an account?{" "}
          <button className="auth-secondary-btn" onClick={() => navigate("/")}>
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
