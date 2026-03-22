require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");
const User = require("./models/User");

const API_URL = "https://cseplacement.onrender.com/api";

async function verifyMLServer() {
  console.log("=========================================");
  console.log("   Render ML Server Verification Tool    ");
  console.log("=========================================\n");

  const testEmail = `test_ml_${Date.now()}@example.com`;
  const testPassword = "password123";
  let token = null;

  try {
    console.log("1. Connecting to MongoDB to intercept OTP...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("   ✅ Connected to database.\n");

    console.log(`2. Registering test user (${testEmail}) on production API...`);
    await axios.post(`${API_URL}/auth/register`, {
      name: "Test User",
      username: `testuser${Date.now()}`,
      email: testEmail,
      password: testPassword,
      role: "student"
    });
    console.log("   ✅ Registration successful.\n");

    console.log("3. Fetching OTP from database...");
    await new Promise(r => setTimeout(r, 2000)); // wait for DB insert
    const user = await User.findOne({ email: testEmail });
    if (!user || !user.otp) {
        throw new Error("OTP not found in database. Registration failed?");
    }
    const otp = user.otp;
    console.log(`   ✅ Intercepted OTP: ${otp}\n`);

    console.log("4. Verifying OTP...");
    await axios.post(`${API_URL}/auth/verify-otp`, {
        email: testEmail,
        otp: otp
    });
    console.log("   ✅ OTP verified.\n");

    console.log("5. Logging into production API...");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        identifier: testEmail,
        password: testPassword
    });
    token = loginRes.data.token;
    console.log("   ✅ Logged in successfully. JWT obtained.\n");

    console.log("6. Creating a dummy PDF resume to test ML Server...");
    const dummyPdfPath = path.join(__dirname, "dummy_resume.pdf");
    // Just write a minimal valid PDF header so multer accepts it
    fs.writeFileSync(dummyPdfPath, "%PDF-1.4\n%EOF\n");

    console.log("7. Uploading resume to trigger ML extraction endpoint...");
    const form = new FormData();
    form.append("resume", fs.createReadStream(dummyPdfPath));

    const uploadRes = await axios.post(`${API_URL}/users/upload-resume`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: token // Protect middleware expects raw token, not Bearer scheme
      }
    });

    console.log("\n--- RESULT ---");
    if (uploadRes.data.analysisStatus === "success") {
        console.log("✅ The ML Server is RUNNING CORRECTLY on Render!");
        console.log("Extracted Skills:", uploadRes.data.skills);
    } else {
        console.log("❌ The ML Server FAILED or could not be reached by the main API.");
        console.log("Error details:", uploadRes.data.analysisError || uploadRes.data.msg);
    }
    
    // Cleanup
    fs.unlinkSync(dummyPdfPath);
    await User.deleteOne({ email: testEmail });
    process.exit(0);

  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED:", error.response?.data || error.message);
    process.exit(1);
  }
}

verifyMLServer();
