const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["student", "company", "admin"],
    default: "student",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  skills: {
    type: [String],
    default: [],
  },
  otp: String,
  otpExpiry: Date,
  resume: String,
  mobile: String,
  approved: { type: Boolean, default: false }, // for company
});

module.exports = mongoose.model("User", userSchema);
