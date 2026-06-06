/**
 * Format a date string or timestamp into a readable format
 * @param {String|Date|Number} dateValue - The date value to format
 * @param {Object} options - Custom formatting options
 * @returns {String} Formatted date string
 */
export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return date.toLocaleDateString('en-IN', defaultOptions);
};

export default formatDate;
