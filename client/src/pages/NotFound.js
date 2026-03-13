import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div style={{ textAlign: "center", padding: "5rem", color: "white" }}>
            <h1 style={{ fontSize: "6rem", marginBottom: "1rem", background: "var(--gradient-text)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</h1>
            <h2 style={{ marginBottom: "2rem" }}>Page Not Found</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>The page you are looking for does not exist.</p>
            <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '12px 30px' }}>
                Go Home
            </Link>
        </div>
    );
}

export default NotFound;
