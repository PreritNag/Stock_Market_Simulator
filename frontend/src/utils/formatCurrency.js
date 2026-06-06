/**
 * Format a number as Indian Rupees (INR)
 * @param {Number} value - The number to format
 * @param {Object} options - Custom formatting options
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const num = Number(value || 0);
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  });
};

export default formatCurrency;
