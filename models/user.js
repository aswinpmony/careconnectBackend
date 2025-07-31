const mongoose = require("mongoose");

const healthLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  bloodPressure: String,
  sugarLevel: String,
  cholesterol: String,
  notes: String,
});

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
    healthLogs: [healthLogSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
