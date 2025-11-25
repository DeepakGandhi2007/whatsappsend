const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ success: false, message: "User already exists" });

    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const newUser = new User({
      email,
      password,
      dailyCount: 0,
      lastReset: null,
      createdAt: Date.now(),
      expiresAt: expiryDate,
    });
    
    await newUser.save();

    res.json({
      success: true,
      userId: newUser._id,
      expiresAt: newUser.expiresAt
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Login
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // User not logged in yet
    if (!user.deviceId) {
      const token = uuidv4();
      user.deviceId = deviceId;
      user.token = token;
      await user.save();

      return res.json({ success: true, token, userId: user._id });
    }

    // User already logged in from this device
    if (user.deviceId === deviceId) {
      return res.json({ success: true, token: user.token, userId: user._id });
    }

    // User trying to log in from another device
    return res.status(403).json({
      success: false,
      message: "This account is already in use on another device."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ token });

    if (!user) return res.status(400).json({ success: false, message: "Invalid token" });

    user.deviceId = null;
    user.token = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Check auth
exports.checkAuth = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const user = await User.findOne({ token });

    if (user) return res.json({ success: true, userId: user._id });
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
