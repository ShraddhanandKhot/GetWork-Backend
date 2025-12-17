const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Worker = require("../models/Worker");
const Organization = require("../models/Organization");
const sendEmail = require("../utils/sendEmail");

function genToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* ================================
   WORKER REGISTER
================================ */
exports.registerWorker = async (req, res) => {
  try {
    const { name, age, skills, location, email, password } = req.body;
    const phone = req.body.phone ? req.body.phone.replace(/^0+/, "") : "";

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
      email,
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
exports.loginWorker = async (req, res) => {
  try {
    const { password } = req.body;
    const phone = req.body.phone ? req.body.phone.replace(/^0+/, "") : "";

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
    const { name, location, email, password } = req.body;
    const phone = req.body.phone ? req.body.phone.replace(/^0+/, "") : "";

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
    const { password } = req.body;
    const phone = req.body.phone ? req.body.phone.replace(/^0+/, "") : "";

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
    console.error("SEND OTP ERROR (RAW):", err?.response?.data || err);
    return res.status(500).json({
      success: false,
      message: err?.response?.data || "Server error",
    });
  }

};

const axios = require("axios");
// ... other requires at top of file (bcrypt, jwt, Worker, Organization, etc.)

exports.sendOTP = async (req, res) => {
  try {
    const { phone, email } = req.body;

    let user;
    if (phone) {
      user = (await Worker.findOne({ phone })) || (await Organization.findOne({ phone }));
    } else if (email) {
      user = (await Worker.findOne({ email })) || (await Organization.findOne({ email }));
    }

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    if (email) {
      // Send Email OTP
      try {
        await sendEmail({
          email: user.email,
          subject: "GetWork Password Reset OTP",
          message: `<p>Your OTP for password reset is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
        });
        return res.json({ success: true, message: "OTP sent to email successfully" });
      } catch (emailError) {
        console.error("Email send error:", emailError);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        return res.status(500).json({ success: false, message: "Email could not be sent: " + emailError.message });
      }
    } else {
      // Send SMS OTP (Existing Logic)
      console.log("Trying to send SMS via Fast2SMS...");
      const payload = {
        route: "v3",
        sender_id: "TXTIND",
        message: `Your GetWork OTP is ${otp}`,
        language: "english",
        numbers: phone.toString(),
      };

      const headers = {
        authorization: process.env.FAST2SMS_KEY,
        "Content-Type": "application/json",
      };

      const response = await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        payload,
        { headers }
      );

      if (response.data && response.data.return === true) {
        return res.json({ success: true, message: "OTP sent successfully" });
      } else {
        console.log("Fast2SMS returned error:", response.data);
        return res.status(500).json({ success: false, message: "SMS sending failed", details: response.data });
      }
    }

  } catch (err) {
    console.log("SEND OTP ERROR — FULL RAW ERROR:");
    console.log(err?.response?.data || err);
    return res.status(500).json({ success: false, message: "Server error", error: err?.response?.data || err });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { phone, email, otp } = req.body;

    let user;
    if (phone) {
      user = (await Worker.findOne({ phone })) || (await Organization.findOne({ phone }));
    } else if (email) {
      user = (await Worker.findOne({ email })) || (await Organization.findOne({ email }));
    }

    if (!user)
      return res.status(400).json({ success: false, message: "User not found" });

    if (user.otp !== otp || Date.now() > user.otpExpires)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const role = user instanceof Worker ? "worker" : "organization";

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "OTP Verified",
      token,
      role,
      name: user.name
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // req.user.id comes from authMiddleware
    let user;
    if (req.user.role === "worker") {
      user = await Worker.findById(req.user.id);
    } else if (req.user.role === "org" || req.user.role === "organization") {
      // Note: in loginOrg, role is "org", but verifyOTP sets "organization" (logic in line 335 original).
      // I should probably unify this. In verifyOTP above line 335: const role = user instanceof Worker ? "worker" : "organization";
      // Let's stick to what's in the DB or token.
      user = await Organization.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashed;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================================
   UPDATE WORKER PROFILE
================================ */
exports.updateWorker = async (req, res) => {
  try {
    const { name, age, skills, location, email } = req.body;

    // Safe skills handling
    let skillsArray = [];
    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else if (typeof skills === "string") {
      skillsArray = skills.split(",").map((s) => s.trim());
    }

    const updatedData = {
      name,
      age,
      skills: skillsArray,
      location,
      email,
    };

    const worker = await Worker.findByIdAndUpdate(req.user.id, updatedData, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      worker,
    });
  } catch (err) {
    console.error("UPDATE WORKER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================================
   UPDATE ORG PROFILE
================================ */
exports.updateOrg = async (req, res) => {
  try {
    const { name, location, email } = req.body;

    const updatedData = {
      name,
      location,
      email,
    };

    const org = await Organization.findByIdAndUpdate(req.user.id, updatedData, {
      new: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      org,
    });
  } catch (err) {
    console.error("UPDATE ORG ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

