const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/authController");
const authMiddleware = require("../Middleware/authMiddleware");


router.post("/worker/register", authCtrl.registerWorker);
router.post("/worker/login", authCtrl.loginWorker);
router.post("/org/register", authCtrl.registerOrg);
router.post("/org/login", authCtrl.loginOrg);
router.get("/worker/profile", authMiddleware, authCtrl.getWorkerProfile);
router.get("/org/profile", authMiddleware, authCtrl.getOrgProfile);



module.exports = router;
