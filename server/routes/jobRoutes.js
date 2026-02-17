const express = require("express");
const router = express.Router();

const {
  createJob,
  getJobs,
  applyJob,
  getCompanyJobs,
  updateApplicationStatus,
  getMyApplications,  
  getRecommendedJobs,
  deleteJob

} = require("../controllers/jobController");


const { protect, roleCheck } = require("../middleware/authMiddleware");

/* Create Job (Company) */
router.post("/", protect, roleCheck(["company"]), createJob);

/* Get All Jobs (Student) */
router.get("/", protect, getJobs);

/* Apply Job (Student) */
router.post("/apply/:id", protect, roleCheck(["student"]), applyJob);

/* Company See Their Jobs + Applicants */
router.get("/company", protect, roleCheck(["company"]), getCompanyJobs);


/* Company Update Status */
router.put(
  "/status/:jobId/:studentId",
  protect,
  roleCheck(["company"]),
  updateApplicationStatus
);
router.get(
  "/my-applications",
  protect,
  roleCheck(["student"]),
  getMyApplications
);
router.get(
  "/recommend",
  protect,
  roleCheck(["student"]),
  getRecommendedJobs
);
router.delete(
  "/:id",
  protect,
  roleCheck(["company"]),
  deleteJob
);



module.exports = router;
