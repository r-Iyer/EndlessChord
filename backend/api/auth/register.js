require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const { initializeDbConnection } = require('../../utils/initialiseUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const bcrypt = require('bcrypt');

const router = express.Router();

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

module.exports = router;