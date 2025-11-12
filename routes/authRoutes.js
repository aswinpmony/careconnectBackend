const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  addHealthLog,
  searchUsers,
  sendConnectionRequest,
  getPendingRequests,
  respondToRequest,
  getLinkedUsers,
  getMyConnections,
  removeConnection,
  getHealthLogs,
  getProfileData,
  getConnectedElderDetails,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

// ==================== USER AUTHENTICATION ====================
router.post("/register", registerUser);
router.post("/login", loginUser);

// Update user profile
router.put("/update-profile/:userId", updateProfile);

// Change password
router.put("/change-password/:userId", changePassword);

// ==================== HEALTH MANAGEMENT ====================
// Add a new health log entry
router.post("/add-health-log", addHealthLog);

// Get health logs for a specific user (with optional filters)
router.get("/get-health-logs/:userId", getHealthLogs);

// ==================== PROFILE MANAGEMENT ====================
// Get user profile data
router.get("/get-profile-data/:userId", getProfileData);

// ==================== USER SEARCH & DISCOVERY ====================
// Search users by name (for finding elders/caregivers)
router.get("/search-users", searchUsers);

// ==================== CONNECTION MANAGEMENT ====================
// Send a connection request from one user to another
router.post("/send-request", sendConnectionRequest);

// Get all pending connection requests for a user
router.get("/connection-requests/pending/:userId", getPendingRequests);

// Accept or reject a connection request
router.put("/respond-request", respondToRequest);

// Get all connections for a user
router.get("/my-connections/:userId", getMyConnections);

// Get linked (connected) users
router.get("/linked-users/:userId", getLinkedUsers);

// Remove a connection between two users
// router.delete("/remove-connection/:connectionId", removeConnection);
router.delete("/remove-connection", removeConnection);

// ==================== ELDER HEALTH DETAILS ====================
// Get detailed information about a connected elder
// UPDATED: Now requires both caregiverId and elderId for security
router.get(
  "/get-connected-elder/:caregiverId/:elderId",
  getConnectedElderDetails
);

module.exports = router;
