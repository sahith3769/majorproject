import { useEffect, useState } from "react";
import API from "../services/api";
import Loader from "../components/Loader";
import { toast } from "react-toastify";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/jobs/my-applications");
      setApplications(data || []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (jobId) => {
    if (!window.confirm("Are you sure you want to remove this application from your history?")) return;

    try {
      await API.delete(`/jobs/application/${jobId}`);
      toast.success("Application Removed");
      fetchApps();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to remove application");
    }
  };

  if (loading) return <div className="dashboard"><Loader /></div>;

  return (
    <div className="dashboard">
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', marginRight: '15px' }}>←</button>
          <h2 className="section-title" style={{ margin: 0 }}>📂 My Applications</h2>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ color: '#94a3b8' }}>You haven't applied to any jobs yet.</p>
          <button onClick={() => window.location.href = '/student'} style={{ marginTop: '20px', background: 'var(--primary)', padding: '10px 20px', borderRadius: '8px', color: 'white' }}>Find Jobs</button>
        </div>
      ) : (
        <div className="jobs-grid">
          {applications.map((app, index) => (
            <div className="card fade-in" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{app.jobTitle}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <span className={`status ${app.status}`}>{app.status}</span>
                  {app.status !== "pending" && (
                    <button
                      onClick={() => deleteApplication(app.jobId)}
                      style={{
                        fontSize: '0.7rem',
                        color: '#f43f5e',
                        padding: '2px 8px',
                        border: '1px solid #f43f5e',
                        borderRadius: '4px',
                        background: 'transparent',
                        fontWeight: '600'
                      }}
                    >
                      Delete Historical Record
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏢 <span style={{ color: 'white' }}>{app.companyName}</span>
              </p>
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', fontSize: '0.85rem', color: '#64748b' }}>
                Applied on: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyApplications;
