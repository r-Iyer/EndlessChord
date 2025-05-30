const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

// Helper function to generate JWT token
const generateToken = (user) => {
  if (!JWT_SECRET || !JWT_EXPIRES_IN) {
    throw new Error('JWT_SECRET and JWT_EXPIRES_IN must be defined in environment variables');
  }

  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Middleware to verify JWT token (optional authentication)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const isGuest = req.headers['x-guest-mode'] === 'true';

    // Allow guest mode
    if (isGuest) {
      req.user = 'guest';
      return next();
    }

    // If no token, continue as unauthenticated
    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token if present
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        req.user = null; // Invalid token, continue as unauthenticated
      } else {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    // In case something unexpected happens (e.g. malformed token format)
    req.user = null;
    next();
  }
};

module.exports = { generateToken, optionalAuth };
