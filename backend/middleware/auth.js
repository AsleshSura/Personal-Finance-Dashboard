const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token format'
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user exists and is active
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Account deactivated'
        });
      }

      // Add user info to request
      req.user = {
        userId: user._id,
        email: user.email,
        name: user.name
      };

      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Token expired'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid token'
        });
      }

      throw jwtError;
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          name: user.name
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional auth
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;