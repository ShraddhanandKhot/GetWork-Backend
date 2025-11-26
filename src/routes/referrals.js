const express = require("express");
const router = express.Router();
const refCtrl = require("../controllers/referralController");
const auth = require("../Middleware/authMiddleware");

router.post("/create", refCtrl.createReferral);
router.get("/pending", auth, refCtrl.getPending); // admin
router.put("/:id", auth, refCtrl.updateReferral);

module.exports = router;
