import { useSelector } from 'react-redux';

/**
 * Custom hook to get real-time price info for a specific stock symbol
 * @param {String} symbol - The stock symbol to track
 * @returns {Object} Price, change, and change percent
 */
export const useLivePrice = (symbol) => {
  const { stocks } = useSelector((state) => state.market);
  const stock = stocks.find((s) => s.symbol === symbol?.toUpperCase());

  return stock
    ? {
        price: stock.currentPrice,
        change: stock.change,
        changePercent: stock.changePercent,
        name: stock.name,
        sector: stock.sector
      }
    : { price: 0, change: 0, changePercent: 0, name: '', sector: '' };
};

export default useLivePrice;
