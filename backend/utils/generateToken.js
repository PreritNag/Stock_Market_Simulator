const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user ID
 * @param {String} userId - The user's ID
 * @returns {String} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

module.exports = generateToken;
