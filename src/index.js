require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./utils/db");
const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const refRoutes = require("./routes/referrals");
const notifRoutes = require("./routes/notifications");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/referral", refRoutes);
app.use("/api/notifications", notifRoutes);

// health
app.get("/", (req, res) => res.send({ success: true, message: "GetWork API running" }));

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
