const express = require("express");
const router = express.Router();

const {
  getDashboard,
  approveCompany,
  deleteCompany,
  approveJob,
  getAllApplications,
  getAllCompanies,
  getAllStudents,
} = require("../controllers/adminController");

const { protect, roleCheck } = require("../middleware/authMiddleware");

/* Dashboard Stats */
router.get("/dashboard", protect, roleCheck(["admin"]), getDashboard);

/* Approve / Reject Company */
router.put("/approve/:id", protect, roleCheck(["admin"]), approveCompany);

/* Delete Company */
router.delete("/company/:id", protect, roleCheck(["admin"]), deleteCompany);

/* Approve Job */
router.put("/approve-job/:id", protect, roleCheck(["admin"]), approveJob);

/* See All Applications */
router.get("/applications", protect, roleCheck(["admin"]), getAllApplications);

/* Get All Companies */
router.get("/companies", protect, roleCheck(["admin"]), getAllCompanies);

/* Get All Students */
router.get("/students", protect, roleCheck(["admin"]), getAllStudents);

module.exports = router;
