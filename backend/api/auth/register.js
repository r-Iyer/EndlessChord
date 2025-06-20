require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const bcrypt = require('bcrypt');
const logger = require('../../utils/loggerUtils');
const { generateToken } = require('../../utils/authUtils');

const router = express.Router();

// Register route - POST /api/auth/register
router.post('/register', async (req, res) => {
  logger.info('[ROUTE] POST /api/auth/register');
  
  try {
    const { name, email, password } = req.body;
    
    // Validate input presence
    if (!name || !email || !password) {
      logger.warn('[AUTH] Registration attempt missing fields');
      return sendResponse(res, { message: 'Name, email, and password are required' }, 400);
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      logger.warn(`[AUTH] Registration attempt with invalid email: ${email}`);
      return sendResponse(res, { message: 'Please enter a valid email address' }, 400);
    }
    
    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn(`[AUTH] Registration attempt with existing email: ${email}`);
      return sendResponse(res, { message: 'User with this email already exists' }, 409);
    }
    
    // Hash password securely
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user record
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    // Return user data without password
    const userData = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
    
    logger.info(`[AUTH] User registered successfully: ${email}`);
    return sendResponse(res, {
      token,
      user: userData
    }, 201);
    
  } catch (error) {
    logger.error('[AUTH] Registration failed:', error);
    return handleError(res, error, 'Registration failed');
  }
});

module.exports = router;
