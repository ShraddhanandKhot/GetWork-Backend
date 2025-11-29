const Referral = require("../models/Referral");
const ReferralPartner = require("../models/ReferralPartner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const existing = await ReferralPartner.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(400).json({ success: false, message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await ReferralPartner.create({ name, email, phone, password: hashedPassword });

    // Token
    const token = jwt.sign({ id: user._id, role: "referral" }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ success: true, message: "Registered successfully", token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user
    const user = await ReferralPartner.findOne({ phone });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Token
    const token = jwt.sign({ id: user._id, role: "referral" }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ success: true, message: "Login successful", token, referral: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createReferral = async (req, res) => {
  try {
    const { helperName, helperPhone, workerName, workerPhone, workerDetails } = req.body;
    if (!workerName || !workerPhone) return res.status(400).json({ success: false, message: "Missing fields" });
    const r = await Referral.create({ helperName, helperPhone, workerName, workerPhone, workerDetails });
    res.json({ success: true, message: "Referral submitted", referral: r });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Server error" }); }
};

exports.getPending = async (req, res) => {
  try {
    const list = await Referral.find({ status: "pending" });
    res.json({ success: true, referrals: list });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Server error" }); }
};

exports.updateReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const r = await Referral.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, message: "Updated", referral: r });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Server error" }); }
};
