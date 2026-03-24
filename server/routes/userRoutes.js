const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, roleCheck } = require("../middleware/authMiddleware");
const User = require("../models/User");
const logger = require("../config/logger");
const mongoose = require("mongoose");

const fs = require("fs");

/* ======================================================
   STORAGE: uses memoryStorage buffer → saved in MongoDB.
   This avoids Render's ephemeral disk wipe on redeploy.
   ====================================================== */
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf"];
    const ext = require("path").extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF files are allowed."));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


/* Upload Resume → stored as Base64 in MongoDB */
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
      
      // Store file in GridFS via streams instead of heavy Base64 strings
      const mimeType = req.file.mimetype;
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "resumes" });
      
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: mimeType
      });
      
      uploadStream.end(req.file.buffer);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      user.resume = uploadStream.id.toString();
      user.resumeOriginalName = req.file.originalname;

      let skillsExtracted = false;
      let extractError = null;

      // 🔥 Automatic Skill Extraction after Upload
      try {
        const axios = require("axios");
        const FormData = require("form-data");

        const form = new FormData();
        // Re-create a readable stream from the buffer for the ML service
        const { Readable } = require("stream");
        const readable = new Readable();
        readable.push(req.file.buffer);
        readable.push(null);
        form.append("resume", readable, { filename: req.file.originalname, contentType: mimeType });

        const mlUrl = process.env.ML_SERVICE_URL ? process.env.ML_SERVICE_URL.replace(/\/$/, '') : "http://localhost:5001";
        
        const response = await axios.post(`${mlUrl}/analyze-resume`, form, {
          headers: { 
            ...form.getHeaders(),
            "ngrok-skip-browser-warning": "any"
          },
          timeout: 10000
        });

        const { skills } = response.data;
        if (skills && Array.isArray(skills)) {
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
        resume: user._id.toString(), // return user ID so frontend knows resume exists
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

/* Stream Resume file from MongoDB for preview */
router.get("/resume/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("resume resumeOriginalName");
    if (!user || !user.resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    
    const filename = user.resumeOriginalName || "resume.pdf";

    // 1. GridFS Implementation (New Format)
    if (mongoose.Types.ObjectId.isValid(user.resume) && user.resume.length === 24) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "resumes" });
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(user.resume));
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      
      downloadStream.on('error', (err) => {
        logger.error(`GridFS Download Error: ${err.message}`);
        res.status(404).end();
      });
      
      return downloadStream.pipe(res);
    }

    // 2. Legacy Base64 Format Graceful Fallback
    const matches = user.resume.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ 
        error: "Legacy resume format detected. Please re-upload your resume on your profile page to enable previews." 
      });
    }
    
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (error) {
    logger.error(`Resume Preview Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

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
    const { Readable } = require("stream");

    let buffer;
    let mimeType = "application/pdf";
    const filename = user.resumeOriginalName || "resume.pdf";

    if (mongoose.Types.ObjectId.isValid(user.resume) && user.resume.length === 24) {
      // Fetch from GridFS
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "resumes" });
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(user.resume));
      const chunks = [];
      await new Promise((resolve, reject) => {
          downloadStream.on('data', chunk => chunks.push(chunk));
          downloadStream.on('error', reject);
          downloadStream.on('end', resolve);
      });
      buffer = Buffer.concat(chunks);
    } else {
      // Extract buffer from legacy base64 data URI
      const matches = user.resume.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
         return res.status(400).json({ 
           error: "Legacy resume format. Please re-upload your resume on your profile page to use AI scanning." 
         });
      }
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    }

    const form = new FormData();
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    form.append("resume", readable, { filename, contentType: mimeType });

    const mlUrl = process.env.ML_SERVICE_URL ? process.env.ML_SERVICE_URL.replace(/\/$/, '') : "http://localhost:5001";
    
    logger.info(`Sending resume for user ${user.email} to ML service for analysis...`);
    
    const response = await axios.post(`${mlUrl}/analyze-resume`, form, {
      headers: {
        ...form.getHeaders(),
        "ngrok-skip-browser-warning": "any"
      },
      timeout: 15000
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
    res.status(500).json({ error: "Failed to analyze resume. Make sure ML service is running." });
  }
});

module.exports = router;
