// models/Session.js
const mongoose = require("mongoose");

// --- NEW: Define a sub-schema for the latestActivity object ---
// This tells Mongoose exactly what fields to expect, which improves reliability.
const latestActivitySchema = new mongoose.Schema({
  service: { type: String, default: "Initializing..." },
  productivity: { type: String, default: "Analyzing..." },
  reason: { type: String, default: "Waiting for data..." },
  timestamp: { type: Date, default: Date.now },
}, { _id: false }); // _id: false prevents Mongoose from creating a separate ID for this sub-document

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },

  focusTime: { type: Number, default: 0 },
  distractionTime: { type: Number, default: 0 },

  appUsage: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Use the new, more explicit sub-schema here
  latestActivity: {
    type: latestActivitySchema,
    default: () => ({}) // Use a function to create a new default object
  },

}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);