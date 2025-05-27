require('dotenv').config();
const express = require('express');
const User = require('../../models/User');
const { initializeDbConnection } = require('../../utils/initialiseUtils');
const { handleError, sendResponse } = require('../../utils/handlerUtils');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../utils/authUtils');


const router = express.Router();

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