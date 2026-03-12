const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  salary: {
    type: String,
    required: false, //  Optional to support backward compatibility
  },
  experience: {
    type: String,
    required: false, // Optional
  },
  /* Indexes for Performance Optimization */
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  deadline: {
    type: Date,
    required: [true, 'Please specify a deadline for this job'],
    index: true,
  },
  skillsRequired: {
    type: [String],
    index: true,
  },

  applicants: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      appliedAt: {
        type: Date,
        default: Date.now
      }
    },
  ],
});

// Compound index for finding if a user has already applied
jobSchema.index({ "applicants.student": 1, "_id": 1 });

module.exports = mongoose.model("Job", jobSchema);
