const User = require("../models/user");
const bcrypt = require("bcryptjs");
const ConnectionRequest = require("../models/connectionRequest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ------------------- REGISTER -------------------
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

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- LOGIN -------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

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

// ------------------- ADD HEALTH LOG -------------------
exports.addHealthLog = async (req, res) => {
  try {
    const {
      date,
      bloodPressure,
      heartRate,
      temperature,
      sugarLevel,
      cholesterol,
      oxygenLevel,
      weight,
      notes,
      userId,
    } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ message: "User ID and date are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate and categorize health status
    let status = "Normal";
    let alerts = [];

    // Blood Pressure Check (systolic/diastolic)
    if (bloodPressure) {
      const [systolic, diastolic] = bloodPressure.split("/").map(Number);
      if (systolic > 140 || diastolic > 90) {
        status = "Critical";
        alerts.push("High blood pressure detected");
      } else if (systolic < 90 || diastolic < 60) {
        status = "Warning";
        alerts.push("Low blood pressure detected");
      }
    }

    // Heart Rate Check
    if (heartRate) {
      if (heartRate > 100) {
        status = "Critical";
        alerts.push("Elevated heart rate");
      } else if (heartRate < 60) {
        status = "Warning";
        alerts.push("Low heart rate");
      }
    }

    // Sugar Level Check
    if (sugarLevel) {
      if (sugarLevel > 180) {
        status = "Critical";
        alerts.push("High blood sugar");
      } else if (sugarLevel < 70) {
        status = "Critical";
        alerts.push("Low blood sugar");
      }
    }

    // Temperature Check (Celsius)
    if (temperature) {
      if (temperature > 38) {
        status = "Warning";
        alerts.push("Fever detected");
      } else if (temperature < 36) {
        status = "Warning";
        alerts.push("Low body temperature");
      }
    }

    // Oxygen Level Check
    if (oxygenLevel && oxygenLevel < 95) {
      status = "Critical";
      alerts.push("Low oxygen saturation");
    }

    const healthLog = {
      date,
      bloodPressure,
      heartRate,
      temperature,
      sugarLevel,
      cholesterol,
      oxygenLevel,
      weight,
      notes,
      status,
      alerts,
      recordedAt: new Date(),
    };

    user.healthLogs.push(healthLog);
    await user.save();

    return res.status(200).json({
      message: "Health log added successfully",
      healthLog,
      alerts: alerts.length > 0 ? alerts : null,
    });
  } catch (err) {
    console.error("Add health log error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- GET HEALTH LOGS -------------------
exports.getHealthLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, sortBy = "date" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Sort and limit health logs
    let logs = user.healthLogs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    return res.status(200).json({
      message: "Health logs fetched successfully",
      healthLogs: logs,
      totalLogs: user.healthLogs.length,
    });
  } catch (err) {
    console.error("Get health logs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- GET PROFILE -------------------
exports.getProfileData = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "User profile fetched successfully",
      userData: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        dob: user.dateOfBirth,
        address: user.location,
        role: user.role,
        emergencyContact: user.emergencyContact,
        healthIssues: user.healthIssues,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- SEARCH USERS -------------------
// ------------------- SEARCH USERS (exclude connected + pending) -------------------
exports.searchUsers = async (req, res) => {
  try {
    const searchQuery = (req.query.q || "").trim();
    const currentUserId = req.query.userId;

    // Validate current user ID
    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      return res.status(400).json({
        message: "Invalid current user ID",
      });
    }

    // Get the current user's role and connections
    const currentUser = await User.findById(currentUserId).select(
      "linkedUsers role"
    );

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Show only the opposite role
    let targetRoles;

    if (currentUser.role === "Elder") {
      // Elders can find caregivers only
      targetRoles = ["CareGiver", "Caregiver"];
    } else if (
      currentUser.role === "CareGiver" ||
      currentUser.role === "Caregiver"
    ) {
      // Caregivers can find elders only
      targetRoles = ["Elder"];
    } else {
      return res.status(400).json({
        message: "Invalid user role",
      });
    }

    // Find pending requests in either direction
    const pendingRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: currentUserId, status: "pending" },
        { toUserId: currentUserId, status: "pending" },
      ],
    }).select("fromUserId toUserId");

    // Exclude the current user, connected users and pending requests
    const excludeIds = new Set([
      currentUserId.toString(),
      ...currentUser.linkedUsers.map((id) => id.toString()),
    ]);

    pendingRequests.forEach((request) => {
      excludeIds.add(request.fromUserId.toString());
      excludeIds.add(request.toUserId.toString());
    });

    // Escape special regex characters in the search text
    const escapedQuery = searchQuery.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    // Search only users with the opposite role
    const users = await User.find({
      _id: {
        $nin: Array.from(excludeIds),
      },
      role: {
        $in: targetRoles,
      },
      fullName: {
        $regex: escapedQuery,
        $options: "i",
      },
    })
      .select("fullName email role phoneNumber")
      .sort({ fullName: 1 });

    return res.status(200).json(users);
  } catch (err) {
    console.error("Search users error:", err);

    return res.status(500).json({
      message: "Error searching users",
    });
  }
};
// ------------------- SEND CONNECTION REQUEST -------------------
exports.sendConnectionRequest = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    const existingRequest = await ConnectionRequest.findOne({
      fromUserId,
      toUserId,
      status: "pending",
    });

    if (existingRequest)
      return res.status(400).json({ message: "Request already sent" });

    await new ConnectionRequest({ fromUserId, toUserId }).save();
    res.status(200).json({ message: "Connection request sent" });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ message: "Failed to send request" });
  }
};

// ------------------- RESPOND TO REQUEST -------------------
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res
        .status(400)
        .json({ message: "Request ID and action are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID format" });
    }

    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    if (action === "accept") {
      request.status = "accepted";
      await request.save();

      await User.findByIdAndUpdate(request.fromUserId, {
        $addToSet: { linkedUsers: request.toUserId },
      });
      await User.findByIdAndUpdate(request.toUserId, {
        $addToSet: { linkedUsers: request.fromUserId },
      });

      console.log(
        `Connection accepted between ${request.fromUserId} and ${request.toUserId}`
      );
      return res.status(200).json({
        message: "Connection accepted successfully",
        connectionId: request.fromUserId,
      });
    } else if (action === "reject") {
      request.status = "rejected";
      await request.save();

      console.log(`Connection rejected: ${requestId}`);
      return res.status(200).json({ message: "Request rejected successfully" });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'accept' or 'reject'" });
    }
  } catch (err) {
    console.error("Respond request error:", err);
    res.status(500).json({
      message: "Server error while processing request",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ------------------- GET MY CONNECTIONS -------------------
exports.getMyConnections = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId)
      .populate("linkedUsers", "fullName email role phoneNumber")
      .select("linkedUsers");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `Fetched ${user.linkedUsers?.length || 0} connections for user ${userId}`
    );
    res.status(200).json(user.linkedUsers || []);
  } catch (err) {
    console.error("Get connections error:", err);
    res.status(500).json({
      message: "Error fetching connections",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
// ------------------- REMOVE CONNECTION (FIXED) -------------------
exports.removeConnection = async (req, res) => {
  try {
    const { userId, connectionId } = req.body;

    console.log("Remove connection request:", { userId, connectionId });

    // Validation
    if (!userId || !connectionId) {
      return res.status(400).json({
        message: "User ID and connection ID are required",
        received: { userId, connectionId },
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(connectionId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if users exist
    const user = await User.findById(userId);
    const connection = await User.findById(connectionId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Check if connection exists
    const isConnected = user.linkedUsers.some(
      (id) => id.toString() === connectionId
    );

    if (!isConnected) {
      return res.status(400).json({
        message: "Users are not connected",
      });
    }

    // Remove connection from both users
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { linkedUsers: connectionId } },
      { new: true }
    );

    const updateConnection = await User.findByIdAndUpdate(
      connectionId,
      { $pull: { linkedUsers: userId } },
      { new: true }
    );

    // Also delete any connection requests between them
    await ConnectionRequest.deleteMany({
      $or: [
        { fromUserId: userId, toUserId: connectionId },
        { fromUserId: connectionId, toUserId: userId },
      ],
    });

    console.log(
      `Connection removed successfully between ${userId} and ${connectionId}`
    );

    res.status(200).json({
      message: "Connection removed successfully",
      removedConnection: {
        userId: connectionId,
        name: connection.fullName,
      },
    });
  } catch (err) {
    console.error("Remove connection error:", err);
    res.status(500).json({
      message: "Error removing connection",
      error:
        process.env.NODE_ENV === "development" ? err.message : "Server error",
    });
  }
};

// ------------------- GET PENDING REQUESTS -------------------
exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const requests = await ConnectionRequest.find({
      toUserId: userId,
      status: "pending",
    })
      .populate("fromUserId", "fullName email phoneNumber role")
      .sort({ sentAt: -1 });

    console.log(
      `Fetched ${requests.length} pending requests for user ${userId}`
    );
    res.status(200).json(requests || []);
  } catch (err) {
    console.error("Get pending requests error:", err);
    res.status(500).json({
      message: "Error fetching pending requests",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ------------------- GET LINKED USERS -------------------
exports.getLinkedUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId).populate(
      "linkedUsers",
      "fullName email role phoneNumber"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `Fetched ${user.linkedUsers?.length || 0} linked users for user ${userId}`
    );
    res.status(200).json(user.linkedUsers || []);
  } catch (err) {
    console.error("Get linked users error:", err);
    res.status(500).json({
      message: "Error fetching linked users",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ------------------- GET ELDER DETAILS (FIXED) -------------------
exports.getConnectedElderDetails = async (req, res) => {
  try {
    const { caregiverId, elderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(caregiverId)) {
      return res.status(400).json({ message: "Invalid caregiver ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(elderId)) {
      return res.status(400).json({ message: "Invalid elder ID" });
    }

    // Verify caregiver exists and is actually a caregiver
    const caregiver = await User.findById(caregiverId);
    if (!caregiver) {
      return res.status(404).json({ message: "Caregiver not found" });
    }

    if (caregiver.role !== "Caregiver" && caregiver.role !== "CareGiver") {
      return res.status(403).json({ message: "User is not a caregiver" });
    }

    // Verify connection exists
    const isConnected = caregiver.linkedUsers.some(
      (id) => id.toString() === elderId
    );

    if (!isConnected) {
      return res.status(403).json({
        message: "You are not connected to this elder",
      });
    }

    // Fetch elder details
    const elder = await User.findById(elderId).select("-password");

    if (!elder) {
      return res.status(404).json({ message: "Elder not found" });
    }

    if (elder.role !== "Elder") {
      return res.status(400).json({ message: "User is not an elder" });
    }

    // Get recent health logs (last 30)
    const recentLogs = elder.healthLogs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    // Calculate health statistics
    const criticalLogsCount = recentLogs.filter(
      (log) => log.status === "Critical"
    ).length;
    const lastLogDate = recentLogs[0]?.date || null;

    return res.status(200).json({
      message: "Elder details fetched successfully",
      elderData: {
        id: elder._id,
        fullName: elder.fullName,
        email: elder.email,
        phoneNumber: elder.phoneNumber,
        gender: elder.gender,
        dob: elder.dateOfBirth,
        address: elder.location,
        role: elder.role,
        emergencyContact: elder.emergencyContact,
        healthIssues: elder.healthIssues,
        healthLogs: recentLogs,
        statistics: {
          totalLogs: elder.healthLogs.length,
          recentCriticalAlerts: criticalLogsCount,
          lastUpdate: lastLogDate,
        },
      },
    });
  } catch (err) {
    console.error("Get elder details error:", err);
    return res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
// ------------------- UPDATE PROFILE -------------------
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, phoneNumber, location, emergencyContact, healthIssues } =
      req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      return res.status(400).json({
        message: "Valid phone number is required (minimum 10 digits)",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only allowed fields
    user.fullName = fullName.trim();
    user.phoneNumber = phoneNumber.trim();
    user.location = location ? location.trim() : user.location;
    user.emergencyContact = emergencyContact
      ? emergencyContact.trim()
      : user.emergencyContact;
    user.healthIssues = healthIssues ? healthIssues.trim() : user.healthIssues;

    // Save updated user
    await user.save();

    console.log(`Profile updated successfully for user ${userId}`);

    return res.status(200).json({
      message: "Profile updated successfully",
      userData: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        emergencyContact: user.emergencyContact,
        healthIssues: user.healthIssues,
        gender: user.gender,
        dob: user.dateOfBirth,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({
      message: "Server error while updating profile",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ------------------- CHANGE PASSWORD -------------------
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    // Find user with password field
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    console.log(`Password changed successfully for user ${userId}`);

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({
      message: "Server error while changing password",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
