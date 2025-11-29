const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema({
  referralPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "ReferralPartner" },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
  helperName: String,
  helperPhone: String,
  workerName: { type: String, required: true },
  workerPhone: { type: String, required: true },
  workerDetails: Object,
  status: { type: String, enum: ["pending", "hired", "rejected"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Referral", ReferralSchema);
