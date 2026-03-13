import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import Loader from "../components/Loader";

function StudentDashboard() {
  const [jobs, setJobs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", mobile: "", experience: 0 });

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        API.get("/jobs"),
        API.get("/jobs/recommend"),
        API.get("/jobs/my-applications"),
        API.get("/auth/me")
      ]);

      const [jobsRes, recRes, appsRes, userRes] = results;

      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data);
      if (recRes.status === 'fulfilled') setRecommended(recRes.value.data);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data);
      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data);
        setFormData({
          name: userRes.value.data.name || "",
          mobile: userRes.value.data.mobile || "",
          experience: userRes.value.data.experience || 0
        });
      }

      // Log errors if any (for debugging)
      if (recRes.status === 'rejected') console.error("Rec API Failed:", recRes.reason);

    } catch (error) {
      console.error(error);
      toast.error("Partial dashboard load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  /* ================= UPDATE PROFILE ================= */
  const updateProfile = async () => {
    try {
      await API.put("/users/profile", formData);
      toast.success("Profile Updated Successfully");
      fetchData(); // Refresh data to ensure sync
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };


  /* ================= APPLY JOB ================= */
  const applyJob = async (id) => {
    if (!user?.resume) {
      toast.error("Please upload your resume first!");
      return;
    }
    try {
      await API.post(`/jobs/apply/${id}`);
      toast.success("Applied Successfully!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Application Failed");
    }
  };

  /* ================= UPLOAD RESUME ================= */
  const uploadResume = async (e) => {
    try {
      const formData = new FormData();
      formData.append("resume", e.target.files[0]);

      const loadId = toast.loading("Uploading Resume...");

      const res = await API.post("/users/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.update(loadId, { render: res.data.msg || "Resume Uploaded!", type: "success", isLoading: false, autoClose: 3000 });

      if (res.data.skills && res.data.skills.length > 0) {
        toast.info(`Found ${res.data.skills.length} skills in your resume!`, { delay: 3500 });
        fetchData(); // Refresh to show new recommendations
      }
    } catch (error) {
      toast.error("Resume Upload Failed");
    }
  };

  /* ================= ANALYZE RESUME ================= */
  const analyzeResume = async () => {
    try {
      const loadId = toast.loading("Scanning your resume for skills...");
      const res = await API.post("/users/analyze-resume");

      toast.update(loadId, {
        render: "Skills Extracted Successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      if (res.data.skills) {
        toast.info(`Added skills: ${res.data.skills.join(", ")}`, { delay: 1000 });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Analysis Failed");
    }
  };

  /* ================= CALCULATE SKILL MATCHES ================= */
  const getSkillMatch = (job) => {
    if (!user || !user.skills) return { hasMatch: false, missingSkills: job.skillsRequired || [], matchedSkills: [], matchCount: 0 };

    const userSkills = new Set(user.skills.map(s => s.toLowerCase()));

    // Check if skillsRequired exists and is an array
    const jobSkills = Array.isArray(job.skillsRequired)
      ? job.skillsRequired.map(s => s.trim())
      : [];

    if (jobSkills.length === 0) return { hasMatch: true, missingSkills: [], matchedSkills: [], matchCount: 0 }; // No specific skills required

    const missingSkills = jobSkills.filter(skill => !userSkills.has(skill.toLowerCase()));
    const matchedSkills = jobSkills.filter(skill => userSkills.has(skill.toLowerCase()));
    const matchCount = jobSkills.length - missingSkills.length;
    const hasMatch = missingSkills.length === 0;

    return { hasMatch, missingSkills, matchedSkills, matchCount };
  };

  if (loading) return <div className="dashboard"><Loader /></div>;

  return (
    <div className="dashboard">
      <div className="fade-in">
        <h2 className="section-title" style={{ borderBottom: 'none', marginBottom: '10px' }}>
          Welcome, {user?.name || "Student"}!
        </h2>
      </div>

      <div className="widget-row fade-in delay-1">
        <div className="stat-card">
          <div>
            <div style={{ color: '#000000', fontSize: '0.85rem' }}>Total Applications</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{applications.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div style={{ color: '#10b981', fontSize: '0.85rem' }}>Accepted</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {applications.filter(app => app.status === 'accepted').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>Rejected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {applications.filter(app => app.status === 'rejected').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div style={{ color: '#000000', fontSize: '0.85rem' }}>Recommendations</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{recommended.length}</div>
          </div>
        </div>
      </div>

      <div className="fade-in delay-2" style={{ marginBottom: '50px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {/* Upload Resume Widget */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '5px' }}>{user?.resume ? 'Update Resume' : 'Upload Resume'}</h4>
            <p style={{ margin: 0, color: '#000000' }}>
              {user?.resume ? 'Keep your CV up to date for better job matches.' : 'Upload your latest CV to unlock personalized recommendations.'}
            </p>
            {user?.resume && (
              <div style={{ marginTop: '10px' }}>
                <a
                  href={`${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace("/api", "")}/uploads/${user.resume}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: 'var(--primary)',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  Preview Current Resume
                </a>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="file-upload-btn" style={{ padding: '10px 30px', textAlign: 'center' }}>
              <input type="file" onChange={uploadResume} style={{ display: 'none' }} />
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {user?.resume ? 'Update Resume' : 'Upload New Resume'}
              </span>
            </label>

            {user?.resume && (
              <button
                onClick={analyzeResume}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none',
                  padding: '10px 30px',
                  color: 'white'
                }}
              >
                Scan Resume for Skills
              </button>
            )}
          </div>
        </div>

        {/* Personal Info Widget */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h4 style={{ marginBottom: '5px' }}>Personal Information</h4>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.85rem' }}>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your Full Name"
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.85rem' }}>Mobile Number</label>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="e.g. +91 9876543210"
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '0.85rem' }}>Experience (Years)</label>
            <input
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="e.g. 0"
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.85rem' }}>Your Skills</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              background: 'rgba(255,255,255,0.05)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              minHeight: '40px'
            }}>
              {user?.skills && user.skills.length > 0 ? (
                user.skills.map(skill => (
                  <span key={skill} style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: 'var(--primary)',
                    borderRadius: '100px',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    fontWeight: '600'
                  }}>
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No skills added yet. Scan your resume!
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/profile")}
              style={{ padding: 0, marginTop: '5px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}
            >
              Edit Skills
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={updateProfile}
            style={{ marginTop: 'auto', padding: '10px', fontSize: '0.9rem' }}
          >
            Save Changes
          </button>
        </div>
      </div>


      {/* My Application Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }} className="fade-in delay-2">
        <h3 className="section-title" style={{ margin: 0 }}>My Applications</h3>
        <button
          onClick={fetchData}
          style={{ fontSize: '0.9rem', color: '#000000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          Refresh
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="card fade-in delay-2" style={{ textAlign: 'center', padding: '2rem', marginBottom: '40px', background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ color: '#000000' }}>You haven't applied to any jobs yet.</p>
        </div>
      ) : (
        <div className="jobs-grid fade-in delay-2" style={{ marginBottom: '50px' }}>
          {applications.map((app) => (
            <div className="card" key={app.jobId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{app.jobTitle}</h4>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>STATUS</span>
                  <span className={`status ${app.status}`}>{app.status}</span>
                </div>
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {app.companyName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '15px' }}>
                Applied: <strong>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Jobs */}
      <h3 className="section-title fade-in delay-3">Recommended for You</h3>

      {!user?.resume ? (
        <div className="card fade-in delay-3" style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', border: '2px dashed #6366f1' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h4 style={{ marginBottom: '10px' }}>Unlock AI Recommendations</h4>
          <p style={{ color: '#000000', maxWidth: '400px', margin: '0 auto 20px' }}>
            Upload your latest resume to allow our AI to match your skills with the best opportunities.
          </p>
          <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
            <input type="file" onChange={uploadResume} style={{ display: 'none' }} />
            Upload Resume Now
          </label>
        </div>
      ) : recommended.length === 0 ? (
        <div className="card fade-in delay-3" style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)' }}>
          <p>No AI recommendations yet. Ensure your profile skills are updated!</p>
          <button className="btn-primary" onClick={() => navigate("/profile")}>Update Skills</button>
        </div>
      ) : (
        <div className="jobs-grid fade-in delay-3">
          {recommended
            .filter(job => !applications.some(app => app.jobId === job._id))
            .map((job) => {
              const { hasMatch, missingSkills, matchedSkills } = getSkillMatch(job);

              return (
                <div className="card" key={job._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{job.title}</h4>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {job.company?.name || "Unknown Company"}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', height: 'fit-content' }}>
                      {job.matchCount} Matches
                    </div>
                  </div>
                  {job.salary && (
                    <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', marginBottom: '10px' }}>
                      {job.salary} • {job.experience || "Freshers"}
                    </div>
                  )}
                  <p style={{ height: '3em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.description}</p>
                  
                  <div style={{ margin: '20px 0' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', marginBottom: '5px' }}>MATCHED SKILLS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {job.matchedSkills?.length > 0 ? (
                          job.matchedSkills.map(skill => (
                            <span key={skill} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: '600' }}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>None matched</span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '5px' }}>NEEDED SKILLS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {job.missingSkills?.length > 0 ? (
                          job.missingSkills.map(skill => (
                            <span key={skill} style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', color: '#b45309', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.2)', fontWeight: '600' }}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>All skills matched!</span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '15px', fontSize: '0.85rem', fontWeight: '500' }}>
                      {job.missingSkills?.length === 0 ? (
                        <span style={{ color: '#10b981' }}>✅ Full skill match! You are a perfect fit.</span>
                      ) : (
                        <div style={{ color: '#f59e0b' }}>
                          ⚠️ Good match, but you could improve your profile with {job.missingSkills?.length} more skill(s).
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => applyJob(job._id)}
                    className={job.missingSkills?.length > 0 ? "btn-danger" : ""}
                    style={{ width: '100%' }}
                  >
                    {job.missingSkills?.length === 0 ? "Apply Now" : "Apply Anyway"}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* Available Jobs Section */}
      <h3 className="section-title fade-in delay-3" style={{ marginTop: '50px' }}>All Opportunities</h3>

      <div className="jobs-grid fade-in delay-3">
        {jobs
          .filter(job => !applications.some(app => app.jobId === job._id))
          .map((job) => {
            const { hasMatch, missingSkills, matchedSkills } = getSkillMatch(job);

            return (
              <div className="card" key={job._id}>
                <h4>{job.title}</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '5px' }}>
                  {job.company?.name || "Unknown Company"}
                </div>
                {job.salary && (
                  <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', marginBottom: '10px' }}>
                    {job.salary} • {job.experience || "Freshers"}
                  </div>
                )}
                <p style={{ height: '3em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.description}</p>
                <div style={{ margin: '15px 0', fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#10b981', marginBottom: '3px' }}>MATCHED</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {matchedSkills.length > 0 ? (
                        matchedSkills.map(s => (
                          <span key={s} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{s}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>None</span>
                      )}
                    </div>
                  </div>

                  {!hasMatch && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '3px' }}>NEEDED</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {missingSkills.map(s => (
                          <span key={s} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '10px', fontWeight: '600', color: hasMatch ? '#10b981' : '#f59e0b' }}>
                    {hasMatch ? "✅ Perfect skill match!" : `⚠️ Missing ${missingSkills.length} skill(s)`}
                  </div>
                </div>

                <button
                  onClick={() => applyJob(job._id)}
                  className={(!hasMatch && job.skillsRequired?.length > 0) ? "btn-danger" : ""}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  {hasMatch || (job.skillsRequired && job.skillsRequired.length === 0) ? "Apply Now" : "Apply Anyway"}
                </button>
              </div>
            );
          })
        }
      </div>
    </div >
  );
}

export default StudentDashboard;
