
const mongoose = require('mongoose');

// Define the Reset Request schema
const resetRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 3600 // Expire after 1 hour
  }
});

// Create the Reset Request model
const ResetRequest = mongoose.model('ResetRequest', resetRequestSchema);

module.exports = ResetRequest;
