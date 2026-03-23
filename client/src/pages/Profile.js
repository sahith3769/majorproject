import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    skills: "",
    experience: 0,
    resume: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setForm({
          name: data.name,
          skills: data.skills.join(", "),
          experience: data.experience || 0,
          resume: data.resume || "",
        });
      } catch (error) {
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      await API.put("/users/profile", {
        name: form.name,
        skills: form.skills.split(",").map((s) => s.trim()),
        experience: Number(form.experience),
      });

      toast.success("Profile Updated");
    } catch (error) {
      toast.error("Update Failed");
    }
  };

  const autoFillSkills = async () => {
    try {
      const loadId = toast.loading("Analyzing resume...");
      const { data } = await API.post("/users/analyze-resume");

      toast.update(loadId, {
        render: "Skills extracted!",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });

      if (data.skills) {
        setForm(prev => ({
          ...prev,
          skills: data.skills.join(", ")
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Analysis failed. Make sure you have uploaded a resume.");
    }
  };

  const uploadResume = async (e) => {
    try {
      const formData = new FormData();
      formData.append("resume", e.target.files[0]);

      const loadId = toast.loading("Uploading Resume...");

      const res = await API.post("/users/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.update(loadId, { render: res.data.msg || "Resume Uploaded!", type: "success", isLoading: false, autoClose: 3000 });

      // Update local state with new resume and auto-extracted skills
      if (res.data.skills) {
        setForm(prev => ({
          ...prev,
          resume: res.data.resume,
          skills: res.data.skills.join(", ")
        }));
      } else {
        const { data } = await API.get("/auth/me");
        setForm(prev => ({
          ...prev,
          resume: data.resume,
          skills: data.skills.join(", ")
        }));
      }
    } catch (error) {
      toast.error("Resume Upload Failed");
    }
  };

  return (
    <div className="dashboard">
      <div className="fade-in">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', marginRight: '15px' }}>←</button>
          <h2 className="section-title" style={{ margin: 0 }}>Edit Profile</h2>
        </div>

        <div className="job-form" style={{ margin: '0 auto' }}>
          <form onSubmit={updateProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex. John Doe"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Skills <small style={{ fontWeight: 400, opacity: 0.7 }}>(Comma separated)</small></label>
              <input
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="e.g. React, Python, Java"
              />
              <button
                type="button"
                onClick={autoFillSkills}
                style={{
                  marginTop: '10px',
                  fontSize: '0.8rem',
                  padding: '5px 12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid #6366f1',
                  color: '#6366f1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Update from Resume
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Years of Experience</label>
              <input
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. 0 (Fresher)"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '30px', padding: '15px', background: !form.resume ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: !form.resume ? '1px dashed #ef4444' : '1px solid #10b981' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: !form.resume ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                {form.resume ? '✅ Resume Uploaded' : '⚠️ Resume Missing'}
              </label>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#64748b' }}>
                {form.resume
                  ? 'Your resume is used for AI recommendations and job applications.'
                  : 'You must upload a resume to get personalized job recommendations.'}
              </p>
              <label className="file-upload-btn" style={{ display: 'inline-block', padding: '8px 20px', cursor: 'pointer' }}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
                       toast.error("Please select a PDF file only.");
                       e.target.value = null;
                       return;
                    }
                    uploadResume(e);
                  }} 
                  style={{ display: 'none' }} 
                />
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {form.resume ? 'Update Resume' : 'Upload Resume Now'}
                </span>
              </label>
            </div>

            <button className="btn-primary">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
