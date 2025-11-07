const mongoose = require("mongoose");

const sentMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  number: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SentMessage", sentMessageSchema);
