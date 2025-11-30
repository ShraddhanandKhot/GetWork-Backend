const Job = require("../models/Job");
const Notification = require("../models/Notification");

/* ===============================
   CREATE JOB  (Organization Only)
================================ */
exports.createJob = async (req, res) => {
  console.log("ORG ID FROM TOKEN:", req.user);
  try {
    const { title, description, salaryRange, location, category } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const job = await Job.create({
      orgId: req.user.id,
      title,
      description,
      salaryRange,
      location,
      category,
    });

    res.json({ success: true, message: "Job posted successfully", job });
  } catch (err) {
    console.error("CREATE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }


};


/* ===============================
   GET ALL JOBS (Public)
================================ */
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("orgId", "name location");
    res.json({ success: true, jobs });
  } catch (err) {
    console.error("GET JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ===============================
   GET JOB BY ID (Public)
================================ */
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "orgId",
      "name location phone"
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, job });
  } catch (err) {
    console.error("GET SINGLE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ===============================
   GET JOBS OF LOGGED-IN ORG
================================ */
exports.getOrgJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ orgId: req.user.id });
    res.json({ success: true, jobs });
  } catch (err) {
    console.error("ORG JOBS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ===============================
   APPLY FOR JOB (Worker Only)
================================ */
exports.applyJob = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`APPLY JOB REQUEST: JobID=${id}, UserID=${req.user.id}, Role=${req.user.role}`);

    // Restrict to workers only
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: "Only workers can apply for jobs" });
    }

    const workerId = req.user.id;

    // Fetch worker to get name (since token might not have it)
    const worker = await require("../models/Worker").findById(workerId);
    const workerName = worker ? worker.name : "A worker";

    const job = await Job.findById(id);

    if (!job) {
      console.log("Job not found for ID:", id);
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Check if already applied
    const alreadyApplied = job.applicants.some(app => app.worker.toString() === workerId);
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: "Already applied" });
    }

    // Add worker to applicants
    job.applicants.push({ worker: workerId });
    await job.save();
    console.log("Worker added to job applicants");

    // Create Notification for Organization
    if (job.orgId) {
      try {
        await Notification.create({
          recipient: job.orgId,
          recipientModel: "Organization",
          message: `${workerName} applied for your job: ${job.title}`,
          type: "application",
          relatedId: job._id,
          relatedUser: workerId,
          relatedUserModel: "Worker"
        });
        console.log("Notification created for Organization");
      } catch (notifErr) {
        console.error("FAILED TO CREATE ORG NOTIFICATION:", notifErr);
        // Don't fail the request just because notification failed
      }
    } else {
      console.warn("Job has no orgId, skipping org notification");
    }

    // Create Notification for Worker
    try {
      await Notification.create({
        recipient: workerId,
        recipientModel: "Worker",
        message: `You successfully applied for: ${job.title}`,
        type: "info",
        relatedId: job._id,
      });
      console.log("Notification created for Worker");
    } catch (notifErr) {
      console.error("FAILED TO CREATE WORKER NOTIFICATION:", notifErr);
    }

    res.json({ success: true, message: "Application successful" });
  } catch (err) {
    console.error("APPLY JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


/* ===============================
   UPDATE APPLICATION STATUS (Org Only)
================================ */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id, workerId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    const job = await Job.findById(id).populate("orgId", "name phone location");

    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    // Find applicant
    const applicant = job.applicants.find(app => app.worker.toString() === workerId);
    if (!applicant) return res.status(404).json({ success: false, message: "Applicant not found" });

    applicant.status = status;
    await job.save();

    // Notify Worker
    await Notification.create({
      recipient: workerId,
      recipientModel: "Worker",
      message: `Your application for ${job.title} was ${status} by ${job.orgId.name} you can call them  at ${job.orgId.phone} or visit them at ${job.orgId.location}`,
      type: "info",
      relatedId: job._id,
      relatedUser: job.orgId,
      relatedUserModel: "Organization"
    });

    // --- REFERRAL SYNC LOGIC ---
    const referralStatus = status === 'accepted' ? 'hired' : (status === 'rejected' ? 'rejected' : 'pending');

    // Find associated referral
    const referral = await require("../models/Referral").findOne({ jobId: id, workerId: workerId });

    if (referral) {
      referral.status = referralStatus;
      await referral.save();

      // If hired, update partner stats and badges
      if (referralStatus === 'hired') {
        const ReferralPartner = require("../models/ReferralPartner");
        // Check if referrer is a Partner (not a Worker)
        const partner = await ReferralPartner.findById(referral.referralPartnerId);

        if (partner) {
          partner.successfulReferrals += 1;

          // Badge Logic
          if (partner.successfulReferrals >= 1 && !partner.badges.includes("First Success")) {
            partner.badges.push("First Success");
          }
          if (partner.successfulReferrals >= 5 && !partner.badges.includes("Top Partner")) {
            partner.badges.push("Top Partner");
          }

          await partner.save();

          // Notify Partner
          await Notification.create({
            recipient: partner._id,
            recipientModel: "ReferralPartner", // Ensure Notification model supports this or use generic 'User'
            message: `Great news! Your referral ${referral.workerName} was hired for ${job.title}! You earned a reward.`,
            type: "info",
            relatedId: job._id
          });
        }
      }
    }

    res.json({ success: true, message: `Application ${status}` });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await Job.findOne({ _id: jobId, orgId: req.user.id });

    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    await Job.deleteOne({ _id: jobId });

    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    console.error("DELETE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    const updatedData = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: jobId, orgId: req.user.id },
      updatedData,
      { new: true }
    );

    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    res.json({ success: true, message: "Job updated", job });
  } catch (err) {
    console.error("UPDATE JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


