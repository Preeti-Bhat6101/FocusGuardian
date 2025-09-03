// models/Session.js
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption'); // 1. Import the plugin

// This sub-schema is still the best way to define the object we're encrypting.
const latestActivitySchema = new mongoose.Schema({
  service: { type: String, default: "Initializing..." },
  productivity: { type: String, default: "Analyzing..." },
  reason: { type: String, default: "Waiting for data..." },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

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
  
  // This is the sensitive object we will encrypt.
  latestActivity: {
    type: latestActivitySchema,
    default: () => ({})
  },

}, { timestamps: true });

// --- CONFIGURE THE ENCRYPTION PLUGIN ---
const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.SIGNING_KEY;

if (!encKey || !sigKey) {
    console.error("\nFATAL ERROR: ENCRYPTION_KEY and SIGNING_KEY must be set in your .env file.\n");
    process.exit(1);
}

sessionSchema.plugin(encrypt, { 
    encryptionKey: encKey, 
    signingKey: sigKey,
    
    // --- SPECIFY THE ONLY FIELD TO ENCRYPT ---
    // We are only encrypting the 'latestActivity' object.
    fields: ['latestActivity'],
    
    // Good practice option
    decryptPostSave: false
});

module.exports = mongoose.model("Session", sessionSchema);