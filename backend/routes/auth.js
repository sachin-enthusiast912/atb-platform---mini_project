const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide all required fields' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'tester'
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide email and password' 
      });
    }
    
    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated. Please contact administrator.' 
      });
    }
    
    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'Email already in use' 
        });
      }
      user.email = email.toLowerCase();
    }
    
    await user.save();
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating profile' 
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide current and new password' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'New password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error changing password' 
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to access this route' 
      });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching users' 
    });
  }
});

module.exports = router;