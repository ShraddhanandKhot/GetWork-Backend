const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  skills: [String],
  experience: String,
  location: String,
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  expectedSalary: String,
  availability: String,
  password: { type: String, required: true },
  referredBy: String,
  otp: String,
  otpExpires: Date,

  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Worker", WorkerSchema);
