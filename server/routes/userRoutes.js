const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, roleCheck } = require("../middleware/authMiddleware");
const User = require("../models/User");
const logger = require("../config/logger");

const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* Upload Resume */
router.post(
  "/upload-resume",
  protect,
  roleCheck(["student"]),
  upload.single("resume"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.resume = req.file.filename;
      await user.save();

      res.json({ msg: "Resume Uploaded Successfully" });
    } catch (error) {
      logger.error(`Resume Upload Error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
);

router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.name = req.body.name || user.name;
    user.mobile = req.body.mobile || user.mobile;
    // Skills might be array or string, handle accordingly if needed, but existing code assumes array
    if (req.body.skills) {
      user.skills = Array.isArray(req.body.skills) ? req.body.skills : req.body.skills.split(',').map(s => s.trim());
    }

    await user.save();

    res.json(user);

  } catch (error) {
    logger.error(`Profile Update Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
