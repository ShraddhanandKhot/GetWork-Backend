const mongoose = require("mongoose");

const ReferralPartnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    badges: [{ type: String }],
    totalReferrals: { type: Number, default: 0 },
    successfulReferrals: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("ReferralPartner", ReferralPartnerSchema);
