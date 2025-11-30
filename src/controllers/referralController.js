const Referral = require("../models/Referral");
const ReferralPartner = require("../models/ReferralPartner");
const Job = require("../models/Job");
const Worker = require("../models/Worker");
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

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const Notification = require("../models/Notification");

exports.submitReferral = async (req, res) => {
  try {
    const { jobId, workerName, workerPhone, workerPassword, workerDetails } = req.body;
    const partnerId = req.user.id;

    if (!jobId || !workerName || !workerPhone || !workerPassword) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Fetch Partner (could be ReferralPartner or Worker)
    let partner = await ReferralPartner.findById(partnerId);
    let isWorker = false;
    if (!partner) {
      partner = await Worker.findById(partnerId);
      isWorker = true;
    }

    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

    // 1. Create or Find Worker
    let worker = await Worker.findOne({ phone: workerPhone });
    if (!worker) {
      const hashedPassword = await bcrypt.hash(workerPassword, 10);
      worker = await Worker.create({
        name: workerName,
        phone: workerPhone,
        password: hashedPassword,
        referredBy: partnerId, // Store partner ID as string or ObjectId if schema allows
        ...workerDetails
      });
    }

    // 2. Create Referral Record
    const referral = await Referral.create({
      referralPartnerId: partnerId,
      jobId,
      workerId: worker._id,
      workerName,
      workerPhone,
      workerDetails,
      status: "pending"
    });

    // 3. Add to Job Applicants & Get Job Details
    const job = await Job.findByIdAndUpdate(jobId, {
      $push: { applicants: { worker: worker._id, status: "pending" } }
    }, { new: true }); // Get updated job to ensure we have orgId

    if (job && job.orgId) {
      // 4. Create Notification for Organization
      await Notification.create({
        recipient: job.orgId,
        recipientModel: "Organization",
        message: `Worker ${workerName} was referred by ${partner.name} for your job: ${job.title}. Phone: ${workerPhone}`,
        type: "application",
        relatedId: job._id,
        relatedUser: worker._id,
        relatedUserModel: "Worker"
      });
    }

    // 5. Update Partner Stats (only if it's a ReferralPartner with stats fields)
    if (!isWorker) {
      await ReferralPartner.findByIdAndUpdate(partnerId, { $inc: { totalReferrals: 1 } });
    }

    res.json({ success: true, message: "Referral submitted successfully", referral });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getStats = async (req, res) => {
  try {
    let partner = await ReferralPartner.findById(req.user.id);
    if (!partner) {
      partner = await Worker.findById(req.user.id);
    }

    if (!partner) return res.status(404).json({ success: false, message: "User not found" });

    const referrals = await Referral.find({ referralPartnerId: req.user.id }).populate("jobId", "title").sort({ createdAt: -1 });

    // Calculate stats dynamically if not available on model (e.g. for Workers)
    const total = partner.totalReferrals !== undefined ? partner.totalReferrals : referrals.length;
    const successful = partner.successfulReferrals !== undefined ? partner.successfulReferrals : referrals.filter(r => r.status === 'hired').length;
    const badges = partner.badges || [];

    res.json({
      success: true,
      stats: {
        total,
        successful,
        badges
      },
      referrals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Deprecated or Admin only? Keeping for backward compatibility if needed
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

    // If hired, update successful referrals count for partner
    if (status === "hired" && r.referralPartnerId) {
      await ReferralPartner.findByIdAndUpdate(r.referralPartnerId, { $inc: { successfulReferrals: 1 } });
      // Check for badges logic here (e.g. if successful > 5, add badge)
      const partner = await ReferralPartner.findById(r.referralPartnerId);
      if (partner.successfulReferrals >= 5 && !partner.badges.includes("Top Partner")) {
        partner.badges.push("Top Partner");
        await partner.save();
      }
    }

    res.json({ success: true, message: "Updated", referral: r });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Server error" }); }
};
