const Job = require("../models/Job");
const axios = require("axios");
const User = require("../models/User");
const logger = require("../config/logger");
const { sendStatusEmail, sendAdminNotification } = require("../utils/sendEmail");


/* ================= CREATE JOB ================= */
exports.createJob = async (req, res) => {
  try {
    const { title, description, skillsRequired, deadline, salary, experience } = req.body;

    if (!deadline) {
      return res.status(400).json({ msg: "Deadline is required" });
    }

    if (!salary) {
      return res.status(400).json({ msg: "Salary is required" });
    }

    const job = await Job.create({
      title,
      description,
      skillsRequired,
      deadline,
      salary,
      experience,
      company: req.user.id,
      approved: false, // Explicitly false until admin approves
    });

    // Notify Admin about new job posting
    const company = await User.findById(req.user.id);
    sendAdminNotification("new_job", { 
      companyName: company?.name || "Unknown Company", 
      title: job.title 
    }).catch(err => logger.error(`Admin Notification Fail: ${err.message}`));

    res.status(201).json(job);
  } catch (error) {
    logger.error(`Create Job Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET ALL JOBS (STUDENT VIEW) ================= */
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      approved: true, // ONLY APPROVED JOBS
      $or: [
        { deadline: null },
        { deadline: { $gt: new Date() } }
      ]
    }).populate("company", "name email");

    res.json(jobs);

  } catch (error) {
    logger.error(`Get Jobs Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};


/* ================= APPLY JOB ================= */
exports.applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job.deadline && new Date() > job.deadline) {
      return res.status(400).json({ msg: "Application deadline passed" });
    }

    if (!job) return res.status(404).json({ msg: "Job not found" });

    const alreadyApplied = job.applicants.find(
      (a) => a.student.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.json({ msg: "Already Applied" });
    }

    job.applicants.push({
      student: req.user.id,
      status: "pending",
    });

    await job.save();

    res.json({ msg: "Applied Successfully" });
  } catch (error) {
    logger.error(`Apply Job Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= COMPANY SEE THEIR JOBS + APPLICANTS ================= */
exports.getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.user.id })
      .populate({
        path: "applicants.student",
        select: "name email skills resume experience",
      });

    res.json(jobs);
  } catch (error) {
    logger.error(`Get Company Jobs Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= UPDATE APPLICATION STATUS ================= */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Populate student info to get email and name
    const job = await Job.findById(req.params.jobId).populate("applicants.student");

    if (!job) return res.status(404).json({ msg: "Job not found" });

    // Find the specific application entry for this student
    const applicant = job.applicants.find(
      (a) => a.student._id.toString() === req.params.studentId
    );

    if (!applicant) {
      return res.status(404).json({ msg: "Applicant not found" });
    }

    applicant.status = status;
    job.markModified('applicants'); // Ensure Mongoose detects the change
    await job.save();

    // Send Status Update Email
    if (applicant.student && applicant.student.email) {
      try {
        await sendStatusEmail(
          applicant.student.email,
          job.title,
          status,
          applicant.student.name || "Student"
        );
        logger.info(`Status email sent to ${applicant.student.email}`);
      } catch (emailError) {
        logger.error(`Failed to send status email: ${emailError.message}`);
        // Don't fail the request if email fails, just log it
      }
    }

    res.json({ msg: "Status Updated Successfully" });
  } catch (error) {
    logger.error(`Update Application Status Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
/* ================= STUDENT MY APPLICATIONS ================= */
exports.getMyApplications = async (req, res) => {
  try {
    logger.info(`Getting applications for user: ${req.user.id}`);
    const jobs = await Job.find({
      "applicants.student": req.user.id,
    })
      .populate("company", "name email")
      .populate("applicants.student", "name email");

    logger.info(`Found ${jobs.length} jobs applied to.`);

    const myApplications = jobs.map((job) => {
      // Find the specific application entry for this student
      const application = job.applicants.find((a) => {
        if (!a) return false;
        if (!a.student) return false;

        try {
          // Handle both populated object and raw ObjectId
          const studentId = a.student._id ? a.student._id.toString() : a.student.toString();
          return studentId === req.user.id;
        } catch (err) {
          logger.error(`Error comparing student ID: ${err.message}`);
          return false;
        }
      });

      return {
        jobId: job._id,
        jobTitle: job.title,
        companyName: job.company?.name || "Unknown Company",
        status: application ? application.status : "unknown",
        appliedAt: application ? application.appliedAt : null
      };
    });

    res.json(myApplications);
  } catch (error) {
    logger.error(`Get My Applications Error: ${error.message} \nStack: ${error.stack}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= ML JOB RECOMMENDATION ================= */
exports.getRecommendedJobs = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ msg: "Student profile not found" });
    }

    if (!student.skills || student.skills.length === 0 || !student.resume) {
      return res.json([]);
    }

    const today = new Date();

    // ✅ FILTER EXPIRED JOBS HERE
    const jobs = await Job.find({
      approved: true, // ONLY APPROVED JOBS
      $or: [
        { deadline: null },
        { deadline: { $gt: today } }
      ]
    }).populate("company", "name email").lean(); // Populate company!

    // Try calling ML Service
    try {
      const mlUrl = process.env.ML_SERVICE_URL ? process.env.ML_SERVICE_URL.replace(/\/$/, '') : 'http://localhost:5001';
      
      const mlResponse = await axios.post(`${mlUrl}/recommend`, {
        skills: student.skills,
        jobs: Array.isArray(jobs) ? jobs : [jobs]
      }, {
        headers: {
          "ngrok-skip-browser-warning": "any"
        }
      });

      // Restore populated company data if lost from ML service
      const recommendedJobs = mlResponse.data.map(recJob => {
        const originalJob = jobs.find(j => j._id.toString() === recJob._id.toString());
        return {
          ...originalJob,
          ...recJob,
          company: originalJob ? originalJob.company : recJob.company
        };
      });

      return res.json(recommendedJobs);
    } catch (mlError) {
      // Log the error using the logger if available, else console
      logger.error(`ML Service failed, falling back to local logic: ${mlError.message}`);

      // Fallback Logic
      const recommended = jobs
        .map((job) => {
          const matchedSkills = job.skillsRequired ? job.skillsRequired.filter((skill) =>
            student.skills.some(s => s.toLowerCase() === skill.toLowerCase())
          ) : [];
          
          const missingSkills = job.skillsRequired ? job.skillsRequired.filter((skill) =>
            !student.skills.some(s => s.toLowerCase() === skill.toLowerCase())
          ) : [];

          return {
            _id: job._id,
            title: job.title,
            description: job.description,
            salary: job.salary,
            experience: job.experience,
            company: job.company, // Include company object
            matchedSkills,
            missingSkills,
            matchCount: matchedSkills.length,
          };
        })
        .filter((job) => job.matchCount > 0) // only show matched jobs
        .sort((a, b) => b.matchCount - a.matchCount);

      return res.json(recommended);
    }

  } catch (error) {
    logger.error(`Get Recommended Jobs Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    if (job.company.toString() !== req.user.id)
      return res.status(403).json({ msg: "Unauthorized" });

    await job.deleteOne();
    logger.info(`Job ${req.params.id} deleted by company ${req.user.id}`);
    res.json({ msg: "Job deleted successfully" });
  } catch (error) {
    logger.error(`Delete Job Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= STUDENT DELETE APPLICATION ================= */
exports.deleteApplicationStudent = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });

    const applicationIndex = job.applicants.findIndex(
      (a) => a.student.toString() === req.user.id
    );

    if (applicationIndex === -1) {
      return res.status(404).json({ msg: "Application not found" });
    }

    const application = job.applicants[applicationIndex];

    // Safety check: Don't allow deleting pending applications easily
    if (application.status === "pending") {
      return res.status(400).json({ msg: "You cannot delete a pending application. Please wait for company status." });
    }

    // Remove the application
    job.applicants.splice(applicationIndex, 1);
    await job.save();

    logger.info(`Application for job ${req.params.jobId} deleted by student ${req.user.id}`);
    res.json({ msg: "Application removed from your history" });

  } catch (error) {
    logger.error(`Delete Application Student Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
