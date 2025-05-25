
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ResetRequest = require('../models/ResetRequest');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Return the user without the password
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    
    res.status(200).json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log(`Signup request received for email: ${email}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    
    // Create new user
    const newUser = new User({
      id: uuidv4(),
      name,
      email,
      password
    });
    
    await newUser.save();
    console.log(`New user saved with id: ${newUser.id}`);
    
    // Return the user without the password
    const userWithoutPassword = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };
    
    res.status(201).json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during signup' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }
    
    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save reset request
    const resetRequest = new ResetRequest({
      email,
      code: resetCode
    });
    
    await resetRequest.save();
    
    // In a real app, you would send an email here
    console.log(`Reset code for ${email}: ${resetCode}`);
    
    res.status(200).json({ success: true, message: 'Reset code sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during password reset request' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    // Find valid reset request
    const resetRequest = await ResetRequest.findOne({
      email,
      code,
      timestamp: { $gt: new Date(Date.now() - 3600000) } // Valid for 1 hour
    });
    
    if (!resetRequest) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }
    
    // Update user password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Delete the reset request
    await ResetRequest.deleteOne({ _id: resetRequest._id });
    
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during password reset' });
  }
});

module.exports = router;
