const connectDB = require('../config/db');


const { initializeDatabase } = require('./dbInit');

let dbInitialized = false;

async function initializeDbConnection() {
  if (!dbInitialized) {
    console.log('[INIT] Connecting to MongoDB...');
    await connectDB();
    const { GoogleGenAI } = require('@google/genai');
    ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }); // <-- use 'new'
  }
}

async function initializeDbTables(Channel, Song) {
    if (!dbInitialized) {
      await initializeDatabase(Channel, Song);
      dbInitialized = true;
      console.log('[INIT] Initialization complete.');
    }
}

module.exports = { initializeDbConnection, initializeDbTables };