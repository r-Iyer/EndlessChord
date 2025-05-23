// api/auth.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { initializeDbConnection } = require('../init/initialiseHelper');

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generic error handler
const handleError = (res, error, message = 'Server error', statusCode = 500) => {
  console.error(`[AUTH ERROR] ${message}:`, error);
  return res.status(statusCode).json({ message });
};

// Generic response handler
const sendResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

// Helper function to generate JWT token
const generateToken = (user) => {
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

// Register route - POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('[ROUTE] POST /api/auth/register');
  await initializeDbConnection();
  
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return sendResponse(res, { message: 'Name, email, and password are required' }, 400);
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return sendResponse(res, { message: 'Please enter a valid email address' }, 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendResponse(res, { message: 'User with this email already exists' }, 409);
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    await newUser.save();
    
    // Generate token
    const token = generateToken(newUser);
    
    // Return user data (without password)
    const userData = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
    
    console.log(`[AUTH] User registered successfully: ${email}`);
    sendResponse(res, { 
      token,
      user: userData 
    }, 201);
    
  } catch (error) {
    handleError(res, error, 'Registration failed');
  }
});

// Login route - POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('[ROUTE] POST /api/auth/login');
  await initializeDbConnection();
  
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return sendResponse(res, { message: 'Email and password are required' }, 400);
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendResponse(res, { message: 'Invalid email or password' }, 401);
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendResponse(res, { message: 'Invalid email or password' }, 401);
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    console.log(`[AUTH] User logged in successfully: ${email}`);
    sendResponse(res, { 
      token,
      user: userData 
    });
    
  } catch (error) {
    handleError(res, error, 'Login failed');
  }
});


module.exports = router;