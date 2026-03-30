const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized to access this route' 
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'User not found' 
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ 
          success: false,
          error: 'User account is deactivated' 
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
      
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is invalid or expired' 
      });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error in authentication' 
    });
  }
};

// Middleware to check for specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { auth, authorize };