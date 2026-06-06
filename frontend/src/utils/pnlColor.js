/**
 * Get CSS classes for coloring Profit and Loss values
 * @param {Number} value - The P&L value
 * @param {Boolean} isBg - If true, returns background classes, else returns text classes
 * @returns {String} CSS classes
 */
export const pnlColor = (value, isBg = false) => {
  const num = Number(value || 0);
  if (num > 0) {
    return isBg ? 'bg-gain/10 text-gain' : 'text-gain';
  } else if (num < 0) {
    return isBg ? 'bg-loss/10 text-loss' : 'text-loss';
  }
  return isBg ? 'bg-white/5 text-gray-400' : 'text-gray-400';
};

export default pnlColor;
