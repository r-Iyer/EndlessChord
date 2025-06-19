// Base API URL for the application, sourced from environment variables.
// Falls back to an empty string if not defined.
const API_URL = process.env.REACT_APP_API_URL || '';

// Minimum number of songs to keep in the queue before fetching more.
const MINIMUM_QUEUE_SIZE = 5;

const INITIAL = "initial";
const REFRESH = "refresh"

module.exports = {
  MINIMUM_QUEUE_SIZE,
  API_URL,
  INITIAL,
  REFRESH
};
