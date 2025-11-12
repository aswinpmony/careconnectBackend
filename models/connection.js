const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relationshipType: {
      type: String,
      required: true,
      enum: [
        "parent-child",
        "grandparent-grandchild",
        "spouse",
        "friend",
        "other",
      ],
      default: "parent-child",
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    permissions: {
      viewHealthRecords: {
        type: Boolean,
        default: true,
      },
      receiveEmergencyAlerts: {
        type: Boolean,
        default: true,
      },
      viewAppointments: {
        type: Boolean,
        default: true,
      },
      receiveMedicationReminders: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
connectionSchema.index({ parentId: 1 });
connectionSchema.index({ caregiverId: 1 });
connectionSchema.index({ parentId: 1, caregiverId: 1 });

module.exports = mongoose.model("Connection", connectionSchema);
// Indexes for performance
connectionSchema.index({ parentId: 1 });
connectionSchema.index({ caregiverId: 1 });
connectionSchema.index({ parentId: 1, caregiverId: 1 });

module.exports = mongoose.model("Connection", connectionSchema);
