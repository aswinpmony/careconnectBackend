const mongoose = require("mongoose");

// Health log subdocument
const healthLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  bloodPressure: String,
  sugarLevel: String,
  cholesterol: String,
  notes: String,
});

// ✅ Chat message subdocument (optional but useful)
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, required: true },
    location: { type: String, required: true },
    emergencyContact: { type: String },
    healthIssues: { type: String },
    role: { type: String, enum: ["Elder", "CareGiver"], required: true },

    // Existing health logs
    healthLogs: [healthLogSchema],

    // 🔗 Linked (connected) users
    linkedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 💬 Messages (optional if you're using a separate message model)
    messages: [messageSchema],

    // ✅ To track active socket connections
    socketId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
