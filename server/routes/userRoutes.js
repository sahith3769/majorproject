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
      
      // 🔥 Automatic Skill Extraction after Upload
      try {
        const axios = require("axios");
        const FormData = require("form-data");
        const path = require("path");
        const resumePath = path.join(__dirname, "../uploads", req.file.filename);

        const form = new FormData();
        form.append("resume", fs.createReadStream(resumePath));

        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
        
        const response = await axios.post(`${mlServiceUrl}/analyze-resume`, form, {
          headers: { ...form.getHeaders() },
        });

        const { skills } = response.data;
        if (skills && Array.isArray(skills)) {
          // Merge unique skills
          user.skills = [...new Set([...user.skills, ...skills])];
          logger.info(`Auto-extracted ${skills.length} skills for user ${user.email} after upload`);
        }
      } catch (mlError) {
        logger.error(`Automatic Skill Extraction Failed: ${mlError.message}`);
        // We don't fail the whole upload if just the skill extraction fails
      }

      await user.save();

      res.json({ 
        msg: "Resume Uploaded and Analyzed Successfully", 
        resume: user.resume, 
        skills: user.skills 
      });
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
    if (req.body.experience !== undefined) {
      user.experience = req.body.experience;
    }
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

/* AI Analyze Resume */
router.post("/analyze-resume", protect, roleCheck(["student"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.resume) {
      return res.status(400).json({ error: "No resume found. Please upload one first." });
    }

    const axios = require("axios");
    const FormData = require("form-data");
    const path = require("path");

    const resumePath = path.join(__dirname, "../uploads", user.resume);

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ error: "Resume file not found on server." });
    }

    const form = new FormData();
    form.append("resume", fs.createReadStream(resumePath));

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";
    
    logger.info(`Sending resume ${user.resume} to ML service for analysis...`);
    
    const response = await axios.post(`${mlServiceUrl}/analyze-resume`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    const { skills } = response.data;

    if (skills && Array.isArray(skills)) {
      // Merge unique skills
      const updatedSkills = [...new Set([...user.skills, ...skills])];
      user.skills = updatedSkills;
      await user.save();
      
      logger.info(`Extracted ${skills.length} skills for user ${user.email}`);
      res.json({ msg: "Resume analyzed successfully", skills: updatedSkills });
    } else {
      res.status(500).json({ error: "Failed to extract skills from resume" });
    }

  } catch (error) {
    logger.error(`Resume Analysis Error: ${error.message}`);
    res.status(500).json({ error: "Faild to analyze resume. Make sure ML service is running." });
  }
});

module.exports = router;
