import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function CompanyLogin() {
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

            if (data.role !== "company") {
                toast.error("Access Denied: Not a Company account");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);

            toast.success("Company Login Successful");
            navigate("/company");
        } catch (error) {
            toast.error(error.response?.data?.msg || "Invalid Credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container company-theme">
            <div className="auth-card">
                <h2 style={{ color: '#0f172a' }}>🏢 Company Portal</h2>
                <p className="auth-subtitle">Recruiter Login</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Company Name, Username or Email"
                        value={form.identifier}
                        onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                        required
                        style={{ borderColor: '#cbd5e1' }}
                    />

                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            style={{ borderColor: '#cbd5e1', marginBottom: 0, paddingRight: '50px' }}
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
                                color: '#0f172a',
                                padding: '5px'
                            }}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading} style={{ background: '#0f172a' }}>
                        {loading ? "Verifying..." : "Login to Dashboard"}
                    </button>
                </form>

                <p className="auth-footer">
                    Are you a Student?{" "}
                    <button
                        className="auth-secondary-btn"
                        onClick={() => navigate("/login")}
                        style={{ borderColor: '#0f172a', color: '#0f172a', background: 'rgba(15, 23, 42, 0.05)' }}
                    >
                        Student Login
                    </button>
                </p>
                <p className="auth-footer" style={{ marginTop: '10px' }}>
                    New Company?{" "}
                    <button
                        className="auth-secondary-btn"
                        onClick={() => navigate("/register")}
                        style={{ borderColor: '#0f172a', color: '#0f172a', background: 'rgba(15, 23, 42, 0.05)' }}
                    >
                        Register Here
                    </button>
                </p>
            </div>
        </div>
    );
}

export default CompanyLogin;
