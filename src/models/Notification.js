const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true }, // User ID (Worker or Org)
    recipientModel: { type: String, required: true, enum: ['Worker', 'Organization'] }, // Which model the recipient belongs to
    message: { type: String, required: true },
    type: { type: String, enum: ['application', 'info'], default: 'info' },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // e.g., Job ID
    relatedUser: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedUserModel' },
    relatedUserModel: { type: String, enum: ['Worker', 'Organization'] },
    read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
