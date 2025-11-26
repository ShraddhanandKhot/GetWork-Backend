const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Worker = require("../models/Worker");
const Organization = require("../models/Organization");

function genToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* ================================
   WORKER REGISTER
================================ */
exports.registerWorker = async (req, res) => {
  try {
    const { name, age, skills, location, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    // FIX: Safe skills handling
    let skillsArray = [];

    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else if (typeof skills === "string") {
      skillsArray = skills.split(",").map((s) => s.trim());
    } else {
      skillsArray = [];
    }

    const exists = await Worker.findOne({ phone });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Phone already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const w = await Worker.create({
      name,
      age,
      skills: skillsArray,
      location,
      phone,
      password: hashed,
    });

    const token = genToken({ id: w._id, role: "worker" });

    res.json({
      success: true,
      message: "Worker registered successfully",
      token,
      user: { id: w._id, name: w.name },
    });

  } catch (err) {
    console.error("WORKER REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* ================================
   WORKER LOGIN
================================ */
exports.loginWorker = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const w = await Worker.findOne({ phone });
    if (!w) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const match = await bcrypt.compare(password, w.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const token = genToken({ id: w._id, role: "worker" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: w._id, name: w.name },
    });

  } catch (err) {
    console.error("WORKER LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* ================================
   ORGANIZATION REGISTER
================================ */
exports.registerOrg = async (req, res) => {
  try {
    const { name, location, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    const exists = await Organization.findOne({ phone });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Phone already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const o = await Organization.create({
      name,
      location,
      phone,
      email,
      password: hashed,
    });

    const token = genToken({ id: o._id, role: "org" });

    res.json({
      success: true,
      message: "Organization registered successfully",
      token,
      org: { id: o._id, name: o.name },
    });

  } catch (err) {
    console.error("ORG REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* ================================
   ORGANIZATION LOGIN
================================ */
exports.loginOrg = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const o = await Organization.findOne({ phone });
    if (!o) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const match = await bcrypt.compare(password, o.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone or password",
      });
    }

    const token = genToken({ id: o._id, role: "org" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      org: { id: o._id, name: o.name },
    });

  } catch (err) {
    console.error("ORG LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.getWorkerProfile = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id).select("-password");

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    res.json({
      success: true,
      worker,
    });

  } catch (err) {
    console.error("GET WORKER PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getOrgProfile = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.id).select("-password");

    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.json({ success: true, org });
  } catch (err) {
    console.error("ORG PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

