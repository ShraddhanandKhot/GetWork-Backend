const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["worker", "organization", "none"],
        default: "none"
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'role'
    },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
