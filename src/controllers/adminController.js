const Worker = require("../models/Worker");
const Organization = require("../models/Organization');

exports.getStats = async (req, res) => {
  const workerCount = await Worker.countDocuments();
  const orgCount = await Organization.countDocuments();
  // ... more stats
  res.json({ success:true, counts: { workers: workerCount, organizations: orgCount } });
};

exports.approveWorker = async (req, res) => {
  const { id } = req.params;
  const w = await Worker.findByIdAndUpdate(id, { verified: true }, { new: true });
  res.json({ success:true, message:"Worker approved", worker: w });
};
