/**
 * Validation utilities
 */

/**
 * Validates email format
 * @param {String} email 
 * @returns {Boolean}
 */
const validateEmail = (email) => {
  if (!email) return false;
  const re = /^\S+@\S+\.\S+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates password criteria (at least 6 characters)
 * @param {String} password 
 * @returns {Boolean}
 */
const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validates registration inputs
 * @param {Object} data 
 * @returns {Object} { errors, isValid }
 */
const validateRegisterInput = (data) => {
  const errors = {};
  
  if (!data.name || String(data.name).trim().length === 0) {
    errors.name = 'Name is required';
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please provide a valid email';
  }
  
  if (!data.password || !validatePassword(data.password)) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRegisterInput
};
