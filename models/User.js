// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  dailyCount: Number,
  lastReset: Date,
  deviceId: { type: String, default: null },
  token: { type: String, default: null }
});

module.exports = mongoose.model("User", userSchema);
