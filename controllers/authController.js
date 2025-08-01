const User = require("../models/user");
const bcrypt = require("bcryptjs");
exports.registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      gender,
      location,
      emergencyContact,
      healthIssues,
      role,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !password ||
      !phoneNumber ||
      !dateOfBirth ||
      !gender ||
      !location ||
      !role
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      dateOfBirth,
      gender,
      location,
      emergencyContact,
      healthIssues,
      role,
    });

    await user.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err.message, err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const jwt = require("jsonwebtoken");

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.addHealthLog = async (req, res) => {
  console.log("🔵 Request received at /add-health-log");

  try {
    const { date, bloodPressure, sugarLevel, cholesterol, notes, userId } =
      req.body;

    console.log("📥 Data from frontend:", {
      userId,
      date,
      bloodPressure,
      sugarLevel,
      cholesterol,
      notes,
    });

    // Step 1: Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.fullName);

    // Step 2: Create new health log
    const newLog = {
      date,
      bloodPressure,
      sugarLevel,
      cholesterol,
      notes,
    };

    console.log("📋 New log to be added:", newLog);

    // Step 3: Push to healthLogs and save
    user.healthLogs.push(newLog);

    await user.save();
    console.log("💾 User saved with new health log");

    return res.status(200).json({
      message: "✅ Health log added successfully",
      healthLogs: user.healthLogs,
    });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
