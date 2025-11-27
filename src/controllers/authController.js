const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Worker = require("../models/Worker");
const Organization = require("../models/Organization");

function genToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* ================================
   REGISTER (USER ACCOUNT)
================================ */
exports.register = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Phone already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      phone,
      password: hashed,
      role: "none",
    });

    const token = genToken({ id: user._id, role: "none" });

    res.json({
      success: true,
      message: "Account created successfully",
      token,
      user: { id: user._id, phone: user.phone, role: "none" },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================================
   LOGIN
================================ */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be phone or email

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/Email and password are required",
      });
    }

    // Check if identifier is email or phone
    const isEmail = identifier.includes("@");
    const query = isEmail ? { email: identifier } : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = genToken({ id: user._id, role: user.role });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isProfileComplete: user.role !== "none"
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================================
   CREATE PROFILE
================================ */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, ...profileData } = req.body;

    if (!["worker", "organization"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "none") {
      return res.status(400).json({ success: false, message: "Profile already exists" });
    }

    let profile;
    if (role === "worker") {
      // Handle skills array safely
      let skillsArray = [];
      if (Array.isArray(profileData.skills)) {
        skillsArray = profileData.skills;
      } else if (typeof profileData.skills === "string") {
        skillsArray = profileData.skills.split(",").map((s) => s.trim());
      }

      profile = await Worker.create({
        ...profileData,
        skills: skillsArray,
        phone: user.phone, // Ensure phone matches user
      });
    } else {
      profile = await Organization.create({
        ...profileData,
        phone: user.phone, // Ensure phone matches user
        email: user.email || profileData.email,
      });
    }

    user.role = role;
    user.profileId = profile._id;
    await user.save();

    const token = genToken({ id: user._id, role: user.role });

    res.json({
      success: true,
      message: "Profile created successfully",
      token,
      user: { id: user._id, role: user.role, isProfileComplete: true },
    });

  } catch (err) {
    console.error("CREATE PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================================
   GET PROFILE
================================ */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "none") {
      return res.json({ success: true, role: "none", profile: null });
    }

    let profile;
    if (user.role === "worker") {
      profile = await Worker.findById(user.profileId);
    } else if (user.role === "organization") {
      profile = await Organization.findById(user.profileId);
    }

    res.json({
      success: true,
      role: user.role,
      profile,
    });

  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
