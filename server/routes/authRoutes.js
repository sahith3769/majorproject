const express = require("express");
const router = express.Router();

// const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const { register, login, verifyOtp, refresh, logout, forgotPassword, resetPassword, updatePassword } = require("../controllers/authController");


/* Register */
router.post("/register", register);

/* Verify OTP */
router.post("/verify-otp", verifyOtp);

/* Login */
router.post("/login", login);

/* Refresh Token */
router.post("/refresh", refresh);

/* Logout */
router.post("/logout", logout);

/* Forgot Password */
router.post("/forgot-password", forgotPassword);

/* Reset Password */
router.post("/reset-password", resetPassword);

/* Update Password */
router.put("/update-password", protect, updatePassword);

/* Get Logged-in User (Profile) */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;