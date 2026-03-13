import { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.email) {
      toast.warning("Please enter your email to continue.");
      // If no email in state, we might want to keep the input or redirect
    }
  }, [form.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) {
      toast.error("Email is missing. Try registering again.");
      return;
    }
    setLoading(true);

    try {
      await API.post("/auth/verify-otp", form);
      toast.success("Account Verified! Please Login.");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Verification Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Account</h2>
        <p className="auth-subtitle">
          Enter the OTP sent to <br />
          <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{form.email || "your email"}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {!location.state?.email && (
            <input
              type="email"
              placeholder="Enter your registered email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={{ marginBottom: '20px' }}
            />
          )}

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={form.otp}
            onChange={(e) => setForm({ ...form, otp: e.target.value })}
            required
            maxLength="6"
            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </form>

        <p className="auth-footer">
          <span onClick={() => navigate("/")}>Back to Login</span>
        </p>
      </div>
    </div>
  );
}

export default VerifyOtp;
