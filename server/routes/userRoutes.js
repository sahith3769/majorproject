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

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = require("path").extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, and DOCX are allowed."));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


/* Upload Resume */
router.post(
  "/upload-resume",
  protect,
  roleCheck(["student"]),
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Please select a file to upload." });
      }

      const user = await User.findById(req.user.id);
      user.resume = req.file.filename;
      
      let skillsExtracted = false;
      let extractError = null;

      // 🔥 Automatic Skill Extraction after Upload
      try {
        const axios = require("axios");
        const FormData = require("form-data");
        const path = require("path");
        const resumePath = path.join(__dirname, "../uploads", req.file.filename);

        const form = new FormData();
        form.append("resume", fs.createReadStream(resumePath));

        const mlUrl = process.env.ML_SERVICE_URL ? process.env.ML_SERVICE_URL.replace(/\/$/, '') : "http://localhost:5001";
        
        const response = await axios.post(`${mlUrl}/analyze-resume`, form, {
          headers: { ...form.getHeaders() },
          timeout: 10000 // 10s timeout
        });

        const { skills } = response.data;
        if (skills && Array.isArray(skills)) {
          // Merge unique skills
          user.skills = [...new Set([...user.skills, ...skills])];
          logger.info(`Auto-extracted ${skills.length} skills for user ${user.email} after upload`);
          skillsExtracted = true;
        }
      } catch (mlError) {
        extractError = mlError.response?.data?.error || mlError.message;
        logger.error(`Automatic Skill Extraction Failed: ${extractError}`);
      }

      await user.save();

      res.json({ 
        msg: skillsExtracted 
          ? "Resume Uploaded and Skills Analyzed Successfully!" 
          : "Resume Uploaded, but skill analysis failed. You can try analyzing it manually later.", 
        resume: user.resume, 
        skills: user.skills,
        analysisStatus: skillsExtracted ? "success" : "failed",
        analysisError: extractError
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

    const mlUrl = process.env.ML_SERVICE_URL ? process.env.ML_SERVICE_URL.replace(/\/$/, '') : "http://localhost:5001";
    
    logger.info(`Sending resume ${user.resume} to ML service for analysis...`);
    
    const response = await axios.post(`${mlUrl}/analyze-resume`, form, {
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
