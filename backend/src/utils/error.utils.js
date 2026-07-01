/**
 * Create an HTTP error with a status code.
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Error} Error object with statusCode
 */
const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { createHttpError };
