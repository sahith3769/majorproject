const User = require("../models/User");
const Job = require("../models/Job");
const logger = require("../config/logger");

/* ================= DASHBOARD STATS ================= */
exports.getDashboard = async (req, res) => {
  try {
    const students = await User.countDocuments({ role: "student" });
    const companies = await User.countDocuments({ role: "company" });
    const pendingCompanies = await User.countDocuments({ role: "company", approved: false });
    const jobs = await Job.countDocuments();
    const pendingJobs = await Job.countDocuments({ approved: false });

    res.json({ students, companies, pendingCompanies, jobs, pendingJobs });
  } catch (error) {
    logger.error(`Admin Dashboard Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= APPROVE COMPANY ================= */
exports.approveCompany = async (req, res) => {
  try {
    const { approved } = req.body; // Can be true or false (rejected)
    await User.findByIdAndUpdate(req.params.id, { approved });
    res.json({ msg: `Company ${approved ? 'Approved' : 'Rejected'} Successfully` });
  } catch (error) {
    logger.error(`Approve Company Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= DELETE COMPANY ================= */
exports.deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    await Job.deleteMany({ company: companyId }); // Cascade delete orphaned jobs
    await User.findByIdAndDelete(companyId);
    res.json({ msg: "Company and all associated jobs deleted successfully" });
  } catch (error) {
    logger.error(`Delete Company Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= APPROVE JOB ================= */
exports.approveJob = async (req, res) => {
  try {
    const { approved } = req.body;
    await Job.findByIdAndUpdate(req.params.id, { approved });
    res.json({ msg: `Job ${approved ? 'Approved' : 'Updated'} Successfully` });
  } catch (error) {
    logger.error(`Approve Job Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= ADMIN SEE ALL APPLICATIONS ================= */
exports.getAllApplications = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("company", "name email")
      .populate("applicants.student", "name email skills");

    res.json(jobs);
  } catch (error) {
    logger.error(`Get All Applications Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET ALL COMPANIES ================= */
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await User.find({ role: "company" }).select("-password");
    res.json(companies);
  } catch (error) {
    logger.error(`Get All Companies Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET ALL STUDENTS ================= */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (error) {
    logger.error(`Get All Students Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
