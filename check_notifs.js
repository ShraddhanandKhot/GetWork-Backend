const mongoose = require("mongoose");
const Notification = require("./src/models/Notification");
const Worker = require("./src/models/Worker"); // Need to register model
const Organization = require("./src/models/Organization"); // Need to register model
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to DB");
    try {
        const notifs = await Notification.find({ type: 'application' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("relatedUser");

        console.log("Found " + notifs.length + " application notifications");
        console.log(JSON.stringify(notifs, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit();
});
