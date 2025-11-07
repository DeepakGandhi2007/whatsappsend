const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config();
const connectDB = require("./db.js");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const path = require("path");

const app = express();
app.use(cors({
  origin: "*", // OR restrict to your IP or domain
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async () => {
  await connectDB(); // <--- this ensures DB is ready

  app.use("/auth", authRoutes);
  app.use("/api", messageRoutes);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
