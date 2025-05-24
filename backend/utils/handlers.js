// Generic error handler
const handleError = (res, error, message = 'Server error', statusCode = 500) => {
  console.error(`[ERROR] ${message}:`, error);
  return res.status(statusCode).json({ message });
};

// Generic response handler
const sendResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

module.exports = {
  handleError,
  sendResponse
};