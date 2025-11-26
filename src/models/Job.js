const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  title: String,
  description: String,
  salaryRange: String,
  location: String,
  category: String,
  applicants: [{
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model("Job", JobSchema);
