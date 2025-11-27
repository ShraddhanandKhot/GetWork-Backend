const express = require("express");
const router = express.Router();
const refCtrl = require("../controllers/referralController");
const protect = require("../Middleware/authMiddleware");

router.post("/create", refCtrl.createReferral);
router.get("/pending", protect, refCtrl.getPending); // admin
router.put("/:id", protect, refCtrl.updateReferral);

module.exports = router;
