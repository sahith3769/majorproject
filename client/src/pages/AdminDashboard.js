import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Loader from "../components/Loader";

function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview'); // 'overview', 'applications', 'placed', 'companies', 'jobs'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, companiesRes] = await Promise.all([
          API.get("/admin/applications"),
          API.get("/admin/companies")
        ]);
        setJobs(jobsRes.data || []);
        setCompanies(companiesRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate Stats
  const totalJobs = jobs.length;
  const totalApplications = jobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0);
  const activeCompaniesCount = companies.filter(c => c.approved).length;
  const totalAccepted = jobs.reduce((acc, job) => acc + (job.applicants?.filter(a => a.status === 'accepted').length || 0), 0);

  // Helper to get all applications
  const getAllApplications = () => {
    return jobs.flatMap(job =>
      (job.applicants || []).map(app => ({
        ...app,
        jobTitle: job.title,
        companyName: job.company?.name || "Unknown"
      }))
    );
  };

  const applicationsList = getAllApplications();
  const placedStudentsList = applicationsList.filter(app => app.status === 'accepted');

  const handleBack = () => {
    if (view === 'overview') {
      navigate(-1);
    } else {
      setView('overview');
    }
  };

  if (loading) return <div className="dashboard"><Loader /></div>;

  const renderContent = () => {
    switch (view) {
      case 'applications':
        return (
          <div className="fade-in">
            <h3 style={{ marginBottom: '20px', color: '#000000' }}>All Applications ({applicationsList.length})</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Student</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Job Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Company</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationsList.map((app, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#000000' }}>
                        <div>{app.student?.name || "Unknown"}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.student?.email}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#000000' }}>{app.jobTitle}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{app.companyName}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status ${app.status}`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>{app.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'placed':
        return (
          <div className="fade-in">
            <h3 style={{ marginBottom: '20px', color: '#000000' }}>Placed Students ({placedStudentsList.length})</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Student</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Job Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Company</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {placedStudentsList.map((app, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#000000' }}>
                        <div>{app.student?.name || "Unknown"}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.student?.email}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#000000' }}>{app.jobTitle}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{app.companyName}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{new Date().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'companies':
        return (
          <div className="fade-in">
            <h3 style={{ marginBottom: '20px', color: '#000000' }}>Registered Companies ({companies.length})</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Company Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#000000' }}>{company.name}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{company.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: company.approved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: company.approved ? '#10b981' : '#f59e0b',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {company.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'jobs':
        return (
          <div className="fade-in">
            <h3 style={{ marginBottom: '20px', color: '#000000' }}>All Jobs ({jobs.length})</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Company</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Applicants</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b' }}>Posted On</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#000000' }}>{job.title}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{job.company?.name || "Unknown"}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{job.applicants?.length || 0}</td>
                      <td style={{ padding: '12px', color: '#000000' }}>{new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <>
            {/* Stats Widgets */}
            <div className="widget-row fade-in delay-1">
              <div className="stat-card" onClick={() => setView('jobs')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>💼</div>
                <div>
                  <div style={{ color: '#000000', fontSize: '0.85rem' }}>Total Jobs</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000' }}>{totalJobs}</div>
                </div>
              </div>
              <div className="stat-card" onClick={() => setView('applications')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' }}>📝</div>
                <div>
                  <div style={{ color: '#000000', fontSize: '0.85rem' }}>Applications</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000' }}>{totalApplications}</div>
                </div>
              </div>
              <div className="stat-card" onClick={() => setView('companies')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>🏢</div>
                <div>
                  <div style={{ color: '#000000', fontSize: '0.85rem' }}>Active Companies</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000' }}>{activeCompaniesCount}</div>
                </div>
              </div>
              <div className="stat-card" onClick={() => setView('placed')} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>🎓</div>
                <div>
                  <div style={{ color: '#000000', fontSize: '0.85rem' }}>Students Placed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000' }}>{totalAccepted}</div>
                </div>
              </div>
            </div>

            <div className="jobs-grid">
              {jobs.map((job, index) => (
                <div className="card fade-in" key={job._id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <h4 style={{ marginBottom: '5px', color: '#000000' }}>{job.title}</h4>
                  <p style={{ color: '#000000', fontSize: '0.9rem', marginBottom: '15px' }}>
                    🏢 {job.company?.name || "Unknown Company"}
                  </p>

                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '15px' }}>
                    {job.applicants && job.applicants.length === 0 ? (
                      <p style={{ fontSize: '0.9rem', color: '#000000' }}>No applicants yet</p>
                    ) : (
                      <>
                        <h5 style={{ color: '#000000', fontSize: '0.85rem', marginBottom: '10px' }}>Applicants ({job.applicants.length})</h5>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {job.applicants.map((app, i) =>
                            app.student ? (
                              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '6px' }}>
                                <span style={{ color: '#000000' }}>{app.student?.name}</span>
                                <span className={`status ${app.status}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{app.status}</span>
                              </li>
                            ) : null
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard">
      <div className="fade-in">
        <button className="nav-back-btn" onClick={handleBack} style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span>&larr;</span> Back
        </button>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2.5rem', fontWeight: 'bold', color: '#000000', background: 'none', WebkitTextFillColor: 'initial' }}>Admin Dashboard</h2>
        <p style={{ textAlign: 'center', color: '#000000', marginBottom: '40px' }}>System Overview & Activity Logs</p>
      </div>

      {renderContent()}
    </div>
  );
}
export default AdminDashboard;
