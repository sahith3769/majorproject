import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import Loader from "../components/Loader";

function CompanyDashboard() {
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    salary: "",
    skillsRequired: "",
    deadline: "",
    experience: "",
  });

  const BASE_URL = window.location.origin;

  /* ================= FETCH JOBS ================= */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const [jobsRes, userRes] = await Promise.all([
        API.get("/jobs/company"),
        API.get("/auth/me")
      ]);
      setJobs(jobsRes.data || []);
      setUser(userRes.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /* ================= CREATE JOB ================= */
  const createJob = async (e) => {
    e.preventDefault();

    try {
      await API.post("/jobs", {
        title: form.title,
        description: form.description,
        salary: form.salary,
        skillsRequired: form.skillsRequired
          ? form.skillsRequired.split(",").map((s) => s.trim())
          : [],
        deadline: form.deadline || null,
        experience: form.experience,
      });

      toast.success("Job Created Successfully");

      setForm({
        title: "",
        description: "",
        salary: "",
        skillsRequired: "",
        deadline: "",
        experience: "",
      });

      fetchJobs();

    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to create job");
    }
  };

  /* ================= DELETE JOB ================= */
  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await API.delete(`/jobs/${id}`);
      toast.success("Job Deleted");
      fetchJobs();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (jobId, studentId, status) => {
    try {
      await API.put(`/jobs/status/${jobId}/${studentId}`, { status });
      toast.success(`Applicant ${status}`);
      fetchJobs();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    try { await API.post("/auth/logout"); } catch (err) {}
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const activeJobsCount = jobs.length;
  const totalApplicants = jobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0);
  const pendingActions = jobs.reduce((acc, job) => acc + (job.applicants?.filter(a => a.status === 'pending').length || 0), 0);

  return (
    <div className="dashboard">
      <div className="fade-in">
        <button className="nav-back-btn" onClick={handleLogout} style={{ marginBottom: '1rem' }}>
          &larr; Back
        </button>
        <h2 className="section-title">
          🏢 {user?.name || "Company"} Dashboard
        </h2>
        <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          Manage your job postings and find the best talent.
        </p>

        {user && !user.approved && (
          <div className="card fade-in" style={{ border: '2px solid var(--warning)', background: '#fffbeb', marginBottom: '2rem' }}>
            <h4 style={{ color: '#92400e', margin: 0 }}>⚠️ Account Pending Approval</h4>
            <p style={{ margin: '5px 0 0', fontSize: '0.9rem' }}>
              Your account is currently under review by the administrator. You can post jobs, but they will not be visible to students until your account and the jobs are approved.
            </p>
          </div>
        )}
      </div>

      {/* Stats Widgets */}
      <div className="widget-row fade-in delay-1">
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Active Jobs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{activeJobsCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success)' }}>👥</div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Total Applicants</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalApplicants}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning)' }}>⏳</div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Pending Review</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{pendingActions}</div>
          </div>
        </div>
      </div>

      {/* ================= CREATE JOB FORM ================= */}
      <div className="job-form fade-in delay-2">
        <h3 className="section-title" style={{ marginTop: 0 }}>Post New Job</h3>

        <form onSubmit={createJob}>
          <div className="form-group">
            <label>Job Title</label>
            <input
              placeholder="e.g. Senior React Developer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Salary / CTC</label>
              <input
                placeholder="e.g. 10 LPA"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                style={{ colorScheme: 'light' }}
              />
            </div>

            <div className="form-group">
              <label>Experience</label>
              <input
                placeholder="e.g. 2+ Years"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe the role and responsibilities..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              style={{ minHeight: '100px' }}
            />
          </div>

          <div className="form-group">
            <label>Required Skills (Comma separated)</label>
            <input
              placeholder="e.g. React, Node.js, MongoDB"
              value={form.skillsRequired}
              onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
              required
            />
          </div>

          <button className="btn-primary" type="submit">
            Post Job Opportunity
          </button>
        </form>
      </div>

      {/* ================= JOB LIST ================= */}
      <h3 className="section-title fade-in delay-3">📋 Your Job Postings</h3>

      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            <p>No jobs posted yet.</p>
          </div>
        ) : (
          jobs.map((job, index) => (
            <div className="card fade-in" key={job._id} style={{ animationDelay: `${index * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0 }}>{job.title}</h4>
                    <span className={`status ${job.approved ? 'accepted' : 'pending'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      {job.approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  <p style={{ marginTop: '8px' }}><strong>Salary:</strong> {job.salary}</p>
                  <p><strong>Exp:</strong> {job.experience}</p>
                  <p>📅 {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No Deadline'}</p>
                </div>
                <button className="btn-danger" onClick={() => deleteJob(job._id)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                  🗑 Delete
                </button>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h5 style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  Applicants ({job.applicants?.length || 0})
                </h5>

                {(!job.applicants || job.applicants.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No applications yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {job.applicants.map((app, i) => (
                      app.student ? (
                        <div key={i} style={{
                          background: '#f9fafb',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontWeight: 600 }}>{app.student.name}</div>
                            <span className={`status ${app.status}`}>{app.status}</span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {app.student.email} • Exp: {app.student.experience || 0} Yrs
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            {app.student.resume ? (
                              <a
                                className="cv-link"
                                href={`${BASE_URL}/uploads/${app.student.resume}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View CV
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.8rem' }}>No CV</span>
                            )}

                            {app.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => updateStatus(job._id, app.student._id, "accepted")} style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--success)' }}>
                                  Accept
                                </button>
                                <button className="btn-danger" onClick={() => updateStatus(job._id, app.student._id, "rejected")} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CompanyDashboard;
