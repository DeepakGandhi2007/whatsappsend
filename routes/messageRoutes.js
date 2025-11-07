// routes/messageRoutes.js
const express = require("express");
const multer = require("multer");
const { sendMessage } = require("../controllers/messageController");

const router = express.Router();

// Store file in memory, not disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/send-data", upload.single("file"), sendMessage);

module.exports = router;
