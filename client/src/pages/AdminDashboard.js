import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Loader from "../components/Loader";

function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingJobs: 0, pendingCompanies: 0 });
  const [view, setView] = useState('overview'); // 'overview', 'applications', 'placed', 'companies', 'jobs', 'approvals'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, companiesRes, statsRes] = await Promise.all([
        API.get("/admin/applications"),
        API.get("/admin/companies"),
        API.get("/admin/dashboard")
      ]);
      setJobs(jobsRes.data || []);
      setCompanies(companiesRes.data || []);
      setStats({
        pendingJobs: statsRes.data.pendingJobs || 0,
        pendingCompanies: statsRes.data.pendingCompanies || 0
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleBack = async () => {
    if (view === 'overview') {
      try { await API.post("/auth/logout"); } catch (err) {}
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      navigate("/");
    } else {
      setView('overview');
    }
  };

  const handleApproveCompany = async (id, approved) => {
    try {
      await API.put(`/admin/approve/${id}`, { approved });
      fetchData();
    } catch (error) {
      console.error("Approval error", error);
    }
  };

  const handleApproveJob = async (id, approved) => {
    try {
      await API.put(`/admin/approve-job/${id}`, { approved });
      fetchData();
    } catch (error) {
      console.error("Job approval error", error);
    }
  };

  if (loading) return <div className="dashboard"><Loader /></div>;

  const renderContent = () => {
    switch (view) {
      case 'applications':
        return (
          <div className="fade-in">
            <h3 className="section-title">All Applications ({applicationsList.length})</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationsList.map((app, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.student?.name || "Unknown"}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{app.student?.email}</div>
                      </td>
                      <td>{app.jobTitle}</td>
                      <td>{app.companyName}</td>
                      <td>
                        <span className={`status ${app.status}`}>{app.status}</span>
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
            <h3 className="section-title">Placed Students ({placedStudentsList.length})</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {placedStudentsList.map((app, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.student?.name || "Unknown"}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{app.student?.email}</div>
                      </td>
                      <td>{app.jobTitle}</td>
                      <td>{app.companyName}</td>
                      <td>{new Date().toLocaleDateString()}</td>
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
            <h3 className="section-title">Registered Companies ({companies.length})</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, i) => (
                    <tr key={i}>
                      <td>{company.name}</td>
                      <td>{company.email}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`status ${company.approved ? 'accepted' : 'pending'}`}>
                            {company.approved ? 'Approved' : 'Pending'}
                          </span>
                          {!company.approved && (
                            <button className="btn-primary" onClick={() => handleApproveCompany(company._id, true)} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                              Approve
                            </button>
                          )}
                        </div>
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
            <h3 className="section-title">All Jobs ({jobs.length})</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Company</th>
                    <th>Applicants</th>
                    <th>Posted On</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => (
                    <tr key={i}>
                      <td>{job.title}</td>
                      <td>{job.company?.name || "Unknown"}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`status ${job.approved ? 'accepted' : 'pending'}`}>
                            {job.approved ? 'Approved' : 'Pending'}
                          </span>
                          {!job.approved && (
                            <button className="btn-primary" onClick={() => handleApproveJob(job._id, true)} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                      <td>{job.applicants?.length || 0}</td>
                      <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
       case 'approvals':
        const pendingJobsList = jobs.filter(j => !j.approved);
        const pendingCompaniesList = companies.filter(c => !c.approved);
        return (
          <div className="fade-in">
            <h3 className="section-title">Pending Approvals</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4>🏢 Companies ({pendingCompaniesList.length})</h4>
              {pendingCompaniesList.length === 0 ? <p>No pending companies.</p> : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {pendingCompaniesList.map(c => (
                        <tr key={c._id}>
                          <td>{c.name}</td>
                          <td>{c.email}</td>
                          <td>
                            <button className="btn-primary" onClick={() => handleApproveCompany(c._id, true)}>Approve</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4>💼 Jobs ({pendingJobsList.length})</h4>
              {pendingJobsList.length === 0 ? <p>No pending jobs.</p> : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Company</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {pendingJobsList.map(j => (
                        <tr key={j._id}>
                          <td>{j.title}</td>
                          <td>{j.company?.name}</td>
                          <td>
                            <button className="btn-primary" onClick={() => handleApproveJob(j._id, true)}>Approve</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <>
            {/* Stats Widgets */}
            <div className="widget-row fade-in delay-1">
              <div className="stat-card" onClick={() => setView('jobs')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon">💼</div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Jobs</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalJobs}</div>
                </div>
              </div>
              <div className="stat-card" onClick={() => setView('applications')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon" style={{ background: 'var(--secondary)' }}>📝</div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Applications</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalApplications}</div>
                </div>
              </div>
              <div className="stat-card" onClick={() => setView('companies')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon" style={{ background: 'var(--success)' }}>🏢</div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Companies</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{activeCompaniesCount}</div>
                </div>
              </div>
              <div className="stat-card" onClick={() => setView('placed')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon" style={{ background: 'var(--warning)' }}>🎓</div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Students Placed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalAccepted}</div>
                </div>
              </div>
            </div>

            {(stats.pendingJobs > 0 || stats.pendingCompanies > 0) && (
              <div className="card fade-in" style={{ border: '2px solid var(--warning)', background: '#fffbeb', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#92400e', margin: 0 }}>⚠️ Action Required: Pending Approvals</h4>
                    <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
                      {stats.pendingCompanies} Companies and {stats.pendingJobs} Jobs are awaiting your review.
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => setView('approvals')} style={{ background: '#92400e' }}>
                    Review Now
                  </button>
                </div>
              </div>
            )}

            <div className="jobs-grid">
              {jobs.map((job, index) => (
                <div className="card fade-in" key={job._id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <h4>{job.title}</h4>
                  <p className="job-company">🏢 {job.company?.name || "Unknown Company"}</p>

                  <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
                    {job.applicants && job.applicants.length === 0 ? (
                      <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No applicants yet</p>
                    ) : (
                      <>
                        <h5 style={{ fontSize: '0.85rem', marginBottom: '10px' }}>Applicants ({job.applicants.length})</h5>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {job.applicants.map((app, i) =>
                            app.student ? (
                              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem', background: '#f9fafb', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                <span>{app.student?.name}</span>
                                <span className={`status ${app.status}`}>{app.status}</span>
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
        <button className="nav-back-btn" onClick={handleBack}>
          &larr; Back
        </button>
        <h2 className="section-title" style={{ textAlign: 'center', fontSize: '2rem' }}>
          Admin Portal Overview
        </h2>
        <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          System-wide activity, job placements, and corporate partnerships.
        </p>
      </div>

      {renderContent()}
    </div>
  );
}
export default AdminDashboard;
