const mongoose = require("mongoose");

const OrgSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  phone: { type: String, required: true, unique: true },
  email: String,
  email: String,
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Organization", OrgSchema);
