const Referral = require("../models/Referral");

exports.createReferral = async (req, res) => {
  try {
    const { helperName, helperPhone, workerName, workerPhone, workerDetails } = req.body;
    if (!workerName || !workerPhone) return res.status(400).json({ success:false, message:"Missing fields" });
    const r = await Referral.create({ helperName, helperPhone, workerName, workerPhone, workerDetails });
    res.json({ success:true, message:"Referral submitted", referral: r });
  } catch (err) { console.error(err); res.status(500).json({ success:false, message:"Server error" }); }
};

exports.getPending = async (req, res) => {
  try {
    const list = await Referral.find({ status: "pending" });
    res.json({ success:true, referrals: list });
  } catch (err) { console.error(err); res.status(500).json({ success:false, message:"Server error" }); }
};

exports.updateReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const r = await Referral.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success:true, message:"Updated", referral: r });
  } catch (err) { console.error(err); res.status(500).json({ success:false, message:"Server error" }); }
};
