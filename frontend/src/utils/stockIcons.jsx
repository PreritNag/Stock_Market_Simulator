import React from 'react';
import { 
  FaLandmark, FaLaptopCode, FaIndustry, FaCoins, FaChartLine, 
  FaRegBuilding, FaApple, FaBolt, FaGoogle, FaMicrosoft, 
  FaAmazon, FaCoins as FaGold, FaCar, FaShoppingCart, FaHeartbeat, FaCoffee
} from 'react-icons/fa';

/**
 * Returns a React element of a FontAwesome icon based on the stock symbol.
 * @param {string} symbol - The stock symbol (e.g. "INFY", "HDFCBANK")
 * @returns {React.ReactElement} The corresponding React Icon component
 */
export const getStockIcon = (symbol) => {
  const s = symbol?.toUpperCase() || '';
  
  if (s.includes('NIFTY') || s.includes('SENSEX')) return <FaChartLine />;
  if (s.includes('HDFC') || s.includes('ICICI') || s.includes('AXIS') || s.includes('SBI') || s.includes('BANK')) return <FaLandmark />;
  if (s.includes('INFY') || s.includes('TCS') || s.includes('WIPRO') || s.includes('TECH') || s.includes('ASML')) return <FaLaptopCode />;
  if (s.includes('RELIANCE') || s.includes('ONGC') || s.includes('ENERGY') || s.includes('WAAREE')) return <FaIndustry />;
  if (s.includes('GOLD') || s.includes('SILVER') || s.includes('BEES') || s.includes('COIN')) return <FaCoins />;
  
  // US tech stocks
  if (s === 'AAPL' || s === 'APPLE') return <FaApple />;
  if (s === 'TSLA' || s === 'TESLA') return <FaCar />;
  if (s === 'GOOG' || s === 'GOOGL' || s === 'GOOGLE') return <FaGoogle />;
  if (s === 'MSFT' || s === 'MICROSOFT') return <FaMicrosoft />;
  if (s === 'AMZN' || s === 'AMAZON') return <FaAmazon />;
  
  // E-commerce & Retail
  if (s.includes('FLIPKART') || s.includes('SWIGGY') || s.includes('RETAIL')) return <FaShoppingCart />;
  
  // Health
  if (s.includes('NIVA') || s.includes('HEALTH') || s.includes('PHARMA')) return <FaHeartbeat />;
  
  // Auto
  if (s.includes('AUTO') || s.includes('MOTOR') || s.includes('MARUTI')) return <FaCar />;

  // Default fallback
  return <FaRegBuilding />;
};
