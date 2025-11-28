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

    // Restrict to workers only
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: "Only workers can apply for jobs" });
    }

    const workerId = req.user.id;
    const workerName = req.user.name || "A worker"; // Assuming name is in token or fetched

    const job = await Job.findById(id);
    if (!job) {
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

    // Create Notification for Organization
    await Notification.create({
      recipient: job.orgId,
      recipientModel: "Organization",
      message: `${workerName} applied for your job: ${job.title}`,
      type: "application",
      relatedId: job._id,
      relatedUser: workerId,
      relatedUserModel: "Worker"
    });

    // Create Notification for Worker
    await Notification.create({
      recipient: workerId,
      recipientModel: "Worker",
      message: `You successfully applied for: ${job.title}`,
      type: "info",
      relatedId: job._id,
    });

    res.json({ success: true, message: "Application successful" });
  } catch (err) {
    console.error("APPLY JOB ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ===============================
   UPDATE APPLICATION STATUS (Org Only)
================================ */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id, workerId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    const job = await Job.findById(id);
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
      message: `Your application for ${job.title} was ${status} by ${job.orgId.name} you can conatct them  at ${job.orgId.phone}`,
      type: "info",
      relatedId: job._id,
      relatedUser: job.orgId,
      relatedUserModel: "Organization"
    });

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


