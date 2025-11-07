const axios = require("axios");
const SentMessage = require("../models/SentMessage");

// Bird API details
const WORKSPACE_ID = "1758ad2b-e7ce-4bee-b064-f1dd6cb03518";
const CHANNEL_ID = "238b8071-784c-5931-b6c8-a7871c4d929a";
const PROJECT_ID = "27034ea5-1b63-40a7-9425-643a818c9f82";
const TEMPLATE_VERSION = "75ca8eda-80f5-4725-b3b8-ce06670ac0d7";
const ACCESS_KEY = process.env.BIRD_ACCESS_KEY;

// Helper delay function (for rate limiting)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.sendMessage = async (req, res) => {
  try {
    const { userId, altNumber } = req.body;
    const file = req.file;

    if (!userId)
      return res.status(400).json({ success: false, message: "User ID is required" });

    if (!file)
      return res.status(400).json({ success: false, message: "File is required" });

    // 🧾 Read numbers from uploaded file
    const numbers = file.buffer
      .toString("utf-8")
      .split(/\r?\n/)
      .map(n => n.trim())
      .filter(Boolean);

    if (!numbers.length)
      return res.status(400).json({ success: false, message: "No numbers found in file" });

    const uniqueNumbers = [...new Set(numbers)];

    console.log(`📄 Total unique numbers found: ${uniqueNumbers.length}`);

    // 📊 Get previous records for this user
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    const [weeklyCount, monthlyCount] = await Promise.all([
      SentMessage.countDocuments({ userId, timestamp: { $gte: weekAgo } }),
      SentMessage.countDocuments({ userId, timestamp: { $gte: monthAgo } })
    ]);

    if (weeklyCount >= 10000)
      return res.status(403).json({ success: false, message: "Weekly limit reached" });

    if (monthlyCount >= 40000)
      return res.status(403).json({ success: false, message: "Monthly limit reached" });

    console.log(`🚀 Starting to send ${uniqueNumbers.length} messages for user ${userId}`);

    const results = [];

    for (const number of uniqueNumbers) {
      try {
        const payload = {
          sender: { connector: { identifierValue: "channels@bird.com" } },
          receiver: { contacts: [{ identifierKey: "phonenumber", identifierValue: number }] },
          body: {
            type: "list",
            list: {
              text: "Hey there!\n\nWe're offering a discount on all orders with free shipping. Les commande son traité uniquement sur mon whatsapp ci dessous +33782459853 whatsapp commande",
            },
          },
          template: {
            projectId: PROJECT_ID,
            version: TEMPLATE_VERSION,
            locale: "en",
            variables: {
              phone_1: number,
              phone_2: altNumber,
            },
          },
        };

        console.log(`📤 Sending message to ${number}...`);

        const response = await axios.post(
          `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`,
          payload,
          {
            headers: {
              Authorization: `AccessKey ${ACCESS_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 20000,
          }
        );

        console.log(`✅ Message sent to ${number}`);
        results.push({ number, success: true, data: response.data });

        // 💾 Save in MongoDB
        await SentMessage.create({ userId, number, timestamp: new Date() });

      } catch (err) {
        const status = err.response?.status;
        const errorData = err.response?.data || err.message;
        console.error(`❌ Failed to send to ${number}:`, status, errorData);
        results.push({ number, success: false, error: errorData });
      }

      // Wait 1 second to avoid Bird API rate-limit
      await delay(1000);
    }

    console.log(`✅ Finished sending all messages for user ${userId}`);

    return res.json({
      success: true,
      userId,
      total: uniqueNumbers.length,
      results,
    });

  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
