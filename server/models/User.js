const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, sparse: true },
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
  experience: { type: Number, default: 0 },
  approved: { type: Boolean, default: false }, // for company
});

module.exports = mongoose.model("User", userSchema);
