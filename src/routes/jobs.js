const express = require("express");
const router = express.Router();
const jobCtrl = require("../controllers/jobController");
const auth = require("../Middleware/authMiddleware");

router.post("/create-job", auth, jobCtrl.createJob);
router.get("/", jobCtrl.getJobs);
router.get("/my-jobs", auth, jobCtrl.getOrgJobs);
router.get("/:id", jobCtrl.getJob);
router.post("/:id/apply", auth, jobCtrl.applyJob);
router.put("/:id/application/:workerId", auth, jobCtrl.updateApplicationStatus);

module.exports = router;
