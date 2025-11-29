const express = require("express");
const router = express.Router();
const refCtrl = require("../controllers/referralController");
const auth = require("../Middleware/authMiddleware");

router.post("/register", refCtrl.register);
router.post("/login", refCtrl.login);

// New routes for referral expansion
router.get("/jobs", refCtrl.getJobs); // Public or protected? Maybe public for now
router.post("/submit", auth, refCtrl.submitReferral);
router.get("/stats", auth, refCtrl.getStats);

router.post("/create", refCtrl.createReferral);
router.get("/pending", auth, refCtrl.getPending); // admin
router.put("/:id", auth, refCtrl.updateReferral);

module.exports = router;
