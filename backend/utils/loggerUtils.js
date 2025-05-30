const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';
const logsDir = path.join(__dirname, '../logs');

// Only create logs directory if not in production and if it doesn't exist
if (!isProd && !fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir);
  } catch (err) {
    console.error(`Failed to create logs directory: ${err.message}`);
    // In production, you might want to handle this differently
  }
}

const loggerTransports = [
  new transports.Console(),
];

// Add file transport only if not in production and logs dir exists
if (!isProd && fs.existsSync(logsDir)) {
  loggerTransports.push(
    new transports.File({ filename: path.join(logsDir, 'app.log') })
  );
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: loggerTransports,
});

module.exports = logger;
