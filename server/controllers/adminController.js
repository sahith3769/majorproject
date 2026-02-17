const User = require("../models/User");
const Job = require("../models/Job");
const logger = require("../config/logger");

/* ================= DASHBOARD STATS ================= */
exports.getDashboard = async (req, res) => {
  try {
    const students = await User.countDocuments({ role: "student" });
    const companies = await User.countDocuments({ role: "company" });
    const jobs = await Job.countDocuments();

    res.json({ students, companies, jobs });
  } catch (error) {
    logger.error(`Admin Dashboard Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= APPROVE COMPANY ================= */
exports.approveCompany = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { approved: true });
    res.json({ msg: "Company Approved Successfully" });
  } catch (error) {
    logger.error(`Approve Company Error: ${error.message}`);
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
