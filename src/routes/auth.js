const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const protect = require("../Middleware/authMiddleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes
router.post("/profile", protect, authController.createProfile);
router.get("/profile", protect, authController.getProfile);

module.exports = router;
