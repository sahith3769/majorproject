const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail, sendAdminNotification } = require("../utils/sendEmail");
const logger = require("../config/logger");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, role, skills = [] } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long" });
    }

    const lowerEmail = email.toLowerCase();
    const lowerUsername = username.toLowerCase();

    const existingUser = await User.findOne({ $or: [{ email: lowerEmail }, { username: lowerUsername }] });
    
    if (existingUser) {
      // If user exists but is NOT verified, allow re-sending OTP
      if (!existingUser.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.otp = otp;
        existingUser.otpExpiry = Date.now() + 5 * 60 * 1000;
        // Also update name/role just in case they changed it
        existingUser.name = name;
        existingUser.role = role;
        
        await existingUser.save();
        await sendEmail(email, otp);
        
        return res.json({ msg: "Registration already initiated. A new OTP has been sent to your email." });
      }
      return res.status(400).json({ msg: "User or Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      username: lowerUsername,
      email: lowerEmail,
      password: hashedPassword,
      role,
      skills: Array.isArray(skills) ? skills : [],
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      isVerified: false,
    });

    await sendEmail(email, otp);

    if (role === "company") {
      // Notify Admin about new company registration
      sendAdminNotification("new_company", { name, email }).catch(err => 
        logger.error(`Admin Notification Fail: ${err.message}`)
      );
    }

    res.json({ msg: "OTP sent to email" });

  } catch (error) {
    logger.error(`Registration Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ msg: "Invalid OTP" });

    if (user.otpExpiry < Date.now())
      return res.status(400).json({ msg: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ msg: "Email verified successfully" });

  } catch (error) {
    logger.error(`Verify OTP Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: { $regex: `^${identifier}$`, $options: 'i' } },
        { username: { $regex: `^${identifier}$`, $options: 'i' } }
      ]
    });

    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    // 🔥 VERY IMPORTANT CHECK
    if (!user.isVerified)
      return res.status(400).json({ msg: "Please verify your email first" });

    // Check for Admin Approval if user is a Company
    if (user.role === "company" && !user.approved) {
      return res.status(403).json({ msg: "Your account is pending admin approval. Please wait for an email confirmation." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });

  } catch (error) {
    logger.error(`Login Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
