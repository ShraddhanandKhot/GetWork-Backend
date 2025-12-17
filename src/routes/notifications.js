const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Get notifications for a user
router.get("/:userId", async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.params.userId })
            .sort({ createdAt: -1 })
            .populate("relatedUser", "name skills email phone");
        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Update Action Status
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        await Notification.findByIdAndUpdate(req.params.id, { actionStatus: status, read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Delete Notification
router.delete("/:id", async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Notification deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;
