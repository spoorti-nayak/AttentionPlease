
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define the Preference schema
const preferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  eyeCareSettings: {
    isActive: Boolean,
    workDuration: Number,
    restDuration: Number
  },
  focusSettings: {
    isActive: Boolean,
    threshold: Number,
    timeframe: Number
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create or get the model
const Preference = mongoose.models.Preference || mongoose.model('Preference', preferenceSchema);

// Get user preferences
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const preferences = await Preference.findOne({ userId });
    
    if (!preferences) {
      // Return default preferences if none found
      return res.status(200).json({
        userId,
        eyeCareSettings: {
          isActive: true,
          workDuration: 1200, // 20 minutes
          restDuration: 20 // 20 seconds
        },
        focusSettings: {
          isActive: true,
          threshold: 5,
          timeframe: 60000 // 1 minute
        }
      });
    }
    
    res.status(200).json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Failed to retrieve preferences' });
  }
});

// Update user preferences
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { eyeCareSettings, focusSettings } = req.body;
    
    const updatedPreferences = await Preference.findOneAndUpdate(
      { userId },
      {
        userId,
        eyeCareSettings,
        focusSettings,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json(updatedPreferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

module.exports = router;
