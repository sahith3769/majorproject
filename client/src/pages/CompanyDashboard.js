import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import Loader from "../components/Loader";

function CompanyDashboard() {
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    salary: "",
    skillsRequired: "",
    deadline: "",
    experience: "",
  });

  const BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace("/api", "");

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

  if (loading) return <div className="dashboard"><Loader /></div>;

  const activeJobsCount = jobs.length;
  const totalApplicants = jobs.reduce((acc, job) => acc + (job.applicants?.length || 0), 0);
  const pendingActions = jobs.reduce((acc, job) => acc + (job.applicants?.filter(a => a.status === 'pending').length || 0), 0);

  return (
    <div className="dashboard">
      <div className="fade-in">
        <h2 className="section-title" style={{ borderBottom: 'none', marginBottom: '10px' }}>
          🏢 <span style={{ marginLeft: '10px', color: '#000000' }}>{user?.name || "Company"}</span> Dashboard
        </h2>
        <p style={{ color: '#000000', marginBottom: '40px', fontSize: '1.1rem' }}>
          Manage your job postings and find the best talent.
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="widget-row fade-in delay-1">
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Active Jobs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{activeJobsCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Total Applicants</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalApplicants}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Pending Review</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{pendingActions}</div>
          </div>
        </div>
      </div>

      {/* ================= CREATE JOB FORM ================= */}
      <div className="job-form fade-in delay-2" style={{ maxWidth: '100%', marginBottom: '40px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.4rem' }}>Post New Job</h3>

        <form onSubmit={createJob} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
            <label style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Job Title</label>
            <input
              placeholder="e.g. Senior React Developer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={{ padding: '1.2rem', fontSize: '1.2rem' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Salary / CTC</label>
            <input
              placeholder="e.g. 10 LPA or $80,000"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              required
              style={{ padding: '1.1rem', fontSize: '1.1rem' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              style={{ colorScheme: 'light' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Experience Level</label>
            <input
              placeholder="e.g. 2+ Years or Fresher"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              style={{ padding: '1.1rem', fontSize: '1.1rem' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Description</label>
            <textarea
              placeholder="Describe the role and responsibilities..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <label>Required Skills <small style={{ fontWeight: 400, opacity: 0.7 }}>(Comma separated)</small></label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                placeholder="e.g. React, Node.js, MongoDB"
                value={form.skillsRequired}
                onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <button className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                Post Job
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ================= JOB LIST ================= */}
      <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.4rem' }} className="fade-in delay-3">📋 Your Job Postings</h3>

      <div className="jobs-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>

        {jobs.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No jobs posted yet.</p>
          </div>
        ) : (
          jobs.map((job, index) => (
            <div className="card fade-in" key={job._id} style={{ animationDelay: `${index * 0.1}s`, position: 'relative' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '5px' }}>{job.title}</h4>
                  {job.salary && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Salary: {job.salary}
                    </p>
                  )}
                  {job.experience && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Experience: {job.experience}
                    </p>
                  )}
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    📅 Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No Deadline'}
                  </p>
                </div>
                <button className="danger" onClick={() => deleteJob(job._id)} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ffe4e6', color: '#be123c', border: '1px solid #fda4af', borderRadius: '6px', cursor: 'pointer' }}>
                  🗑 Delete
                </button>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <h5 style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                  Applicants ({job.applicants?.length || 0})
                </h5>

                {(!job.applicants || job.applicants.length === 0) ? (
                  <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>No applications yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {job.applicants.map((app, i) => (
                      app.student ? (
                        <div key={i} style={{
                          background: '#f8fafc', // Light background
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0', // Light border
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.student.name}</div>
                            <span className={`status ${app.status}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>{app.status}</span>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {app.student.email} • <strong>Exp: {app.student.experience || 0} Yrs</strong>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                            {app.student.resume ? (
                              <a
                                className="cv-link"
                                href={`${BASE_URL}/uploads/${app.student.resume}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline', fontWeight: '500' }}
                              >
                                📄 View Resume
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#000000' }}>No Resume</span>
                            )}

                            {app.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => updateStatus(job._id, app.student._id, "accepted")} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)' }}>
                                  Accept
                                </button>
                                <button onClick={() => updateStatus(job._id, app.student._id, "rejected")} style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#ffffff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' }}>
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
