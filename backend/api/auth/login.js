require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../utils/authUtils');
const logger = require('../../utils/loggerUtils');
const connectDB = require('../../config/db');

const router = express.Router();

(async () => {
  await connectDB();
  // Login route - POST /api/auth/login
  router.post('/login', async (req, res) => {
    logger.info('[ROUTE] POST /api/auth/login');
    
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        logger.warn('[AUTH] Login attempt with missing email or password');
        return sendResponse(res, { message: 'Email and password are required' }, 400);
      }
      
      // Find user by email (case-insensitive)
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        logger.warn(`[AUTH] Invalid login attempt - user not found: ${email}`);
        return sendResponse(res, { message: 'Invalid email or password' }, 401);
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`[AUTH] Invalid login attempt - wrong password: ${email}`);
        return sendResponse(res, { message: 'Invalid email or password' }, 401);
      }
      
      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save();
      
      // Generate auth token
      const token = generateToken(user);
      
      // Prepare user data without password
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      
      logger.info(`[AUTH] User logged in successfully: ${email}`);
      return sendResponse(res, {
        token,
        user: userData
      });
    } catch (error) {
      logger.error('[AUTH] Login failed:', error);
      return handleError(res, error, 'Login failed');
    }
  });
})();

module.exports = router;
