/**
 * Stock Seeder
 * Seeds 150 diversified assets (NSE stocks, ETFs, Forex, Crypto, Indices)
 * with real 365 days of historical OHLCV data from Yahoo Finance.
 */

require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const Stock = require('../models/Stock');
const { seedHistoricalData } = require('../services/priceEngine');

const STOCKS = [
  // Stocks (NSE)
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', basePrice: 2500, category: 'STOCK', peRatio: 26.4, dividendYield: 0.8, marketCap: 1750000, yahooSymbol: 'RELIANCE.NS' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT', basePrice: 3500, category: 'STOCK', peRatio: 28.1, dividendYield: 1.4, marketCap: 1280000, yahooSymbol: 'TCS.NS' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', basePrice: 1500, category: 'STOCK', peRatio: 24.5, dividendYield: 2.1, marketCap: 620000, yahooSymbol: 'INFY.NS' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', basePrice: 1600, category: 'STOCK', peRatio: 18.2, dividendYield: 1.1, marketCap: 1210000, yahooSymbol: 'HDFCBANK.NS' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', basePrice: 1050, category: 'STOCK', peRatio: 17.5, dividendYield: 0.9, marketCap: 730000, yahooSymbol: 'ICICIBANK.NS' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', basePrice: 620, category: 'STOCK', peRatio: 9.8, dividendYield: 1.8, marketCap: 550000, yahooSymbol: 'SBIN.NS' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer Goods', basePrice: 2800, category: 'STOCK', peRatio: 52.4, dividendYield: 1.5, marketCap: 268000, yahooSymbol: 'ASIANPAINT.NS' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', basePrice: 440, category: 'STOCK', peRatio: 24.2, dividendYield: 2.7, marketCap: 510000, yahooSymbol: 'ITC.NS' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', basePrice: 10500, category: 'STOCK', peRatio: 29.8, dividendYield: 1.1, marketCap: 310000, yahooSymbol: 'MARUTI.NS' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', sector: 'Pharma', basePrice: 1200, category: 'STOCK', peRatio: 33.1, dividendYield: 0.9, marketCap: 280000, yahooSymbol: 'SUNPHARMA.NS' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', basePrice: 900, category: 'STOCK', peRatio: 16.2, dividendYield: 0.5, marketCap: 320000, yahooSymbol: 'TATAMOTORS.NS' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Construction', basePrice: 3400, category: 'STOCK', peRatio: 32.5, dividendYield: 0.7, marketCap: 480000, yahooSymbol: 'LT.NS' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', basePrice: 1200, category: 'STOCK', peRatio: 55.4, dividendYield: 0.3, marketCap: 680000, yahooSymbol: 'BHARTIARTL.NS' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', basePrice: 1050, category: 'STOCK', peRatio: 13.8, dividendYield: 0.2, marketCap: 330000, yahooSymbol: 'AXISBANK.NS' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', basePrice: 1700, category: 'STOCK', peRatio: 19.5, dividendYield: 0.1, marketCap: 340000, yahooSymbol: 'KOTAKBANK.NS' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Goods', basePrice: 3300, category: 'STOCK', peRatio: 82.4, dividendYield: 0.3, marketCap: 290000, yahooSymbol: 'TITAN.NS' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Financial Services', basePrice: 7000, category: 'STOCK', peRatio: 30.1, dividendYield: 0.4, marketCap: 420000, yahooSymbol: 'BAJFINANCE.NS' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', basePrice: 460, category: 'STOCK', peRatio: 22.5, dividendYield: 0.2, marketCap: 240000, yahooSymbol: 'WIPRO.NS' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT', basePrice: 1300, category: 'STOCK', peRatio: 26.2, dividendYield: 3.7, marketCap: 360000, yahooSymbol: 'HCLTECH.NS' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', sector: 'Infrastructure', basePrice: 1200, category: 'STOCK', peRatio: 35.8, dividendYield: 0.4, marketCap: 260000, yahooSymbol: 'ADANIPORTS.NS' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Diversified', basePrice: 3100, category: 'STOCK', peRatio: 98.4, dividendYield: 0.1, marketCap: 350000, yahooSymbol: 'ADANIENT.NS' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'FMCG', basePrice: 2500, category: 'STOCK', peRatio: 78.1, dividendYield: 1.2, marketCap: 240000, yahooSymbol: 'NESTLEIND.NS' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Materials', basePrice: 9500, category: 'STOCK', peRatio: 38.5, dividendYield: 0.5, marketCap: 270000, yahooSymbol: 'ULTRACEMCO.NS' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals', basePrice: 850, category: 'STOCK', peRatio: 18.2, dividendYield: 0.4, marketCap: 200000, yahooSymbol: 'JSWSTEEL.NS' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals', basePrice: 500, category: 'STOCK', peRatio: 12.4, dividendYield: 0.6, marketCap: 110000, yahooSymbol: 'HINDALCO.NS' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Energy', basePrice: 450, category: 'STOCK', peRatio: 8.5, dividendYield: 5.2, marketCap: 280000, yahooSymbol: 'COALINDIA.NS' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', basePrice: 270, category: 'STOCK', peRatio: 6.4, dividendYield: 4.1, marketCap: 340000, yahooSymbol: 'ONGC.NS' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'Utilities', basePrice: 280, category: 'STOCK', peRatio: 15.2, dividendYield: 3.9, marketCap: 260000, yahooSymbol: 'POWERGRID.NS' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Utilities', basePrice: 360, category: 'STOCK', peRatio: 14.8, dividendYield: 2.1, marketCap: 350000, yahooSymbol: 'NTPC.NS' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', basePrice: 1900, category: 'STOCK', peRatio: 21.2, dividendYield: 0.8, marketCap: 240000, yahooSymbol: 'M&M.NS' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Energy', basePrice: 600, category: 'STOCK', peRatio: 5.2, dividendYield: 3.8, marketCap: 130000, yahooSymbol: 'BPCL.NS' },
  { symbol: 'IOC', name: 'Indian Oil Corp', sector: 'Energy', basePrice: 170, category: 'STOCK', peRatio: 6.1, dividendYield: 4.8, marketCap: 240000, yahooSymbol: 'IOC.NS' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', basePrice: 150, category: 'STOCK', peRatio: 14.2, dividendYield: 2.4, marketCap: 180000, yahooSymbol: 'TATASTEEL.NS' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobile', basePrice: 3900, category: 'STOCK', peRatio: 31.2, dividendYield: 0.9, marketCap: 110000, yahooSymbol: 'EICHERMOT.NS' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', sector: 'Healthcare', basePrice: 6000, category: 'STOCK', peRatio: 72.4, dividendYield: 0.2, marketCap: 86000, yahooSymbol: 'APOLLOHOSP.NS' },
  { symbol: 'REDDY', name: 'Dr. Reddys Laboratories Ltd', sector: 'Pharma', basePrice: 6000, category: 'STOCK', peRatio: 18.5, dividendYield: 0.7, marketCap: 100000, yahooSymbol: 'DRREDDY.NS' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma', basePrice: 1400, category: 'STOCK', peRatio: 28.2, dividendYield: 0.6, marketCap: 112000, yahooSymbol: 'CIPLA.NS' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG', basePrice: 5000, category: 'STOCK', peRatio: 58.1, dividendYield: 1.5, marketCap: 120000, yahooSymbol: 'BRITANNIA.NS' },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', sector: 'Pharma', basePrice: 3700, category: 'STOCK', peRatio: 52.4, dividendYield: 0.8, marketCap: 98000, yahooSymbol: 'DIVISLAB.NS' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking', basePrice: 1500, category: 'STOCK', peRatio: 12.1, dividendYield: 1.0, marketCap: 116000, yahooSymbol: 'INDUSINDBK.NS' },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Diversified', basePrice: 2200, category: 'STOCK', peRatio: 26.5, dividendYield: 0.4, marketCap: 145000, yahooSymbol: 'GRASIM.NS' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile', basePrice: 8500, category: 'STOCK', peRatio: 24.2, dividendYield: 1.6, marketCap: 240000, yahooSymbol: 'BAJAJ-AUTO.NS' },
  { symbol: 'UPL', name: 'UPL Ltd', sector: 'Chemicals', basePrice: 500, category: 'STOCK', peRatio: 14.8, dividendYield: 2.0, marketCap: 38000, yahooSymbol: 'UPL.NS' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Automobile', basePrice: 4500, category: 'STOCK', peRatio: 22.1, dividendYield: 2.2, marketCap: 90000, yahooSymbol: 'HEROMOTOCO.NS' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT', basePrice: 1250, category: 'STOCK', peRatio: 28.5, dividendYield: 3.2, marketCap: 120000, yahooSymbol: 'TECHM.NS' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financial Services', basePrice: 1600, category: 'STOCK', peRatio: 33.4, dividendYield: 0.1, marketCap: 255000, yahooSymbol: 'BAJAJFINSV.NS' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co Ltd', sector: 'Financial Services', basePrice: 1500, category: 'STOCK', peRatio: 82.5, dividendYield: 0.2, marketCap: 150000, yahooSymbol: 'SBILIFE.NS' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co Ltd', sector: 'Financial Services', basePrice: 600, category: 'STOCK', peRatio: 84.1, dividendYield: 0.3, marketCap: 128000, yahooSymbol: 'HDFCLIFE.NS' },
  { symbol: 'SHREECEM', name: 'Shree Cement Ltd', sector: 'Materials', basePrice: 25000, category: 'STOCK', peRatio: 42.1, dividendYield: 0.4, marketCap: 90000, yahooSymbol: 'SHREECEM.NS' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', basePrice: 2400, category: 'STOCK', peRatio: 54.2, dividendYield: 1.6, marketCap: 560000, yahooSymbol: 'HINDUNILVR.NS' },

  // Midcaps & Others (NSE)
  { symbol: 'ADANIPOWER', name: 'Adani Power Ltd', sector: 'Utilities', basePrice: 600, category: 'STOCK', peRatio: 12.8, dividendYield: null, marketCap: 230000, yahooSymbol: 'ADANIPOWER.NS' },
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd', sector: 'Utilities', basePrice: 1800, category: 'STOCK', peRatio: 150.2, dividendYield: null, marketCap: 285000, yahooSymbol: 'ADANIGREEN.NS' },
  { symbol: 'ADANIENSOL', name: 'Adani Energy Solutions Ltd', sector: 'Utilities', basePrice: 1000, category: 'STOCK', peRatio: 84.2, dividendYield: null, marketCap: 110000, yahooSymbol: 'ADANIENSOL.NS' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd', sector: 'Materials', basePrice: 600, category: 'STOCK', peRatio: 38.2, dividendYield: 1.2, marketCap: 120000, yahooSymbol: 'AMBUJACEM.NS' },
  { symbol: 'ACC', name: 'ACC Ltd', sector: 'Materials', basePrice: 2500, category: 'STOCK', peRatio: 26.4, dividendYield: 0.9, marketCap: 47000, yahooSymbol: 'ACC.NS' },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures (Nykaa)', sector: 'Consumer Goods', basePrice: 160, category: 'STOCK', peRatio: 120.5, dividendYield: null, marketCap: 45000, yahooSymbol: 'NYKAA.NS' },
  { symbol: 'PAYTM', name: 'One 97 Communications (Paytm)', sector: 'Financial Services', basePrice: 400, category: 'STOCK', peRatio: null, dividendYield: null, marketCap: 25000, yahooSymbol: 'PAYTM.NS' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', sector: 'Consumer Goods', basePrice: 180, category: 'STOCK', peRatio: 140.2, dividendYield: null, marketCap: 150000, yahooSymbol: 'ZOMATO.NS' },
  { symbol: 'LICHSGFIN', name: 'LIC Housing Finance Ltd', sector: 'Financial Services', basePrice: 650, category: 'STOCK', peRatio: 9.2, dividendYield: 1.4, marketCap: 35000, yahooSymbol: 'LICHSGFIN.NS' },
  { symbol: 'LICI', name: 'Life Insurance Corporation of India', sector: 'Financial Services', basePrice: 950, category: 'STOCK', peRatio: 15.4, dividendYield: 0.8, marketCap: 600000, yahooSymbol: 'LICI.NS' },
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking', basePrice: 260, category: 'STOCK', peRatio: 7.8, dividendYield: 2.1, marketCap: 135000, yahooSymbol: 'BANKBARODA.NS' },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking', basePrice: 120, category: 'STOCK', peRatio: 14.5, dividendYield: 1.2, marketCap: 130000, yahooSymbol: 'PNB.NS' },
  { symbol: 'CANBK', name: 'Canara Bank', sector: 'Banking', basePrice: 110, category: 'STOCK', peRatio: 8.2, dividendYield: 2.4, marketCap: 100000, yahooSymbol: 'CANBK.NS' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', sector: 'Banking', basePrice: 80, category: 'STOCK', peRatio: 18.4, dividendYield: 0.9, marketCap: 56000, yahooSymbol: 'IDFCFIRSTB.NS' },
  { symbol: 'UNIONBANK', name: 'Union Bank of India', sector: 'Banking', basePrice: 140, category: 'STOCK', peRatio: 7.1, dividendYield: 2.2, marketCap: 105000, yahooSymbol: 'UNIONBANK.NS' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking', basePrice: 160, category: 'STOCK', peRatio: 11.2, dividendYield: 1.5, marketCap: 39000, yahooSymbol: 'FEDERALBNK.NS' },
  { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd', sector: 'Banking', basePrice: 180, category: 'STOCK', peRatio: 15.4, dividendYield: 0.8, marketCap: 29000, yahooSymbol: 'BANDHANBNK.NS' },
  { symbol: 'YESBANK', name: 'Yes Bank Ltd', sector: 'Banking', basePrice: 25, category: 'STOCK', peRatio: 65.4, dividendYield: null, marketCap: 72000, yahooSymbol: 'YESBANK.NS' },
  { symbol: 'J&KBANK', name: 'Jammu & Kashmir Bank Ltd', sector: 'Banking', basePrice: 120, category: 'STOCK', peRatio: 6.8, dividendYield: 1.4, marketCap: 12000, yahooSymbol: 'J&KBANK.NS' },
  { symbol: 'TATAELXSI', name: 'Tata Elxsi Ltd', sector: 'IT', basePrice: 7500, category: 'STOCK', peRatio: 61.2, dividendYield: 0.9, marketCap: 46000, yahooSymbol: 'TATAELXSI.NS' },
  { symbol: 'KPITTECH', name: 'KPIT Technologies Ltd', sector: 'IT', basePrice: 1400, category: 'STOCK', peRatio: 82.4, dividendYield: 0.3, marketCap: 38000, yahooSymbol: 'KPITTECH.NS' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'IT', basePrice: 3800, category: 'STOCK', peRatio: 64.2, dividendYield: 0.4, marketCap: 58000, yahooSymbol: 'PERSISTENT.NS' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'IT', basePrice: 5000, category: 'STOCK', peRatio: 42.1, dividendYield: 0.8, marketCap: 31000, yahooSymbol: 'COFORGE.NS' },
  { symbol: 'MPHASIS', name: 'Mphasis Ltd', sector: 'IT', basePrice: 2400, category: 'STOCK', peRatio: 28.4, dividendYield: 2.1, marketCap: 45000, yahooSymbol: 'MPHASIS.NS' },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT', basePrice: 4800, category: 'STOCK', peRatio: 33.1, dividendYield: 1.2, marketCap: 142000, yahooSymbol: 'LTIM.NS' },
  { symbol: 'DIXON', name: 'Dixon Technologies (India) Ltd', sector: 'Consumer Electronics', basePrice: 8000, category: 'STOCK', peRatio: 110.5, dividendYield: 0.1, marketCap: 48000, yahooSymbol: 'DIXON.NS' },
  { symbol: 'HAVELLS', name: 'Havells India Ltd', sector: 'Consumer Goods', basePrice: 1600, category: 'STOCK', peRatio: 74.2, dividendYield: 0.5, marketCap: 100000, yahooSymbol: 'HAVELLS.NS' },
  { symbol: 'VOLTAS', name: 'Voltas Ltd', sector: 'Consumer Goods', basePrice: 1200, category: 'STOCK', peRatio: 58.4, dividendYield: 0.6, marketCap: 40000, yahooSymbol: 'VOLTAS.NS' },
  { symbol: 'BLUESTARCO', name: 'Blue Star Ltd', sector: 'Consumer Goods', basePrice: 1300, category: 'STOCK', peRatio: 56.1, dividendYield: 0.5, marketCap: 25000, yahooSymbol: 'BLUESTARCO.NS' },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', sector: 'Industrial', basePrice: 6200, category: 'STOCK', peRatio: 52.4, dividendYield: 0.4, marketCap: 93000, yahooSymbol: 'POLYCAB.NS' },
  { symbol: 'KEI', name: 'KEI Industries Ltd', sector: 'Industrial', basePrice: 3800, category: 'STOCK', peRatio: 46.2, dividendYield: 0.2, marketCap: 34000, yahooSymbol: 'KEI.NS' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Aerospace & Defense', basePrice: 230, category: 'STOCK', peRatio: 38.5, dividendYield: 0.9, marketCap: 165000, yahooSymbol: 'BEL.NS' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Aerospace & Defense', basePrice: 3800, category: 'STOCK', peRatio: 39.1, dividendYield: 0.6, marketCap: 250000, yahooSymbol: 'HAL.NS' },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals Ltd', sector: 'Industrial', basePrice: 280, category: 'STOCK', peRatio: 90.2, dividendYield: 0.1, marketCap: 98000, yahooSymbol: 'BHEL.NS' },
  { symbol: 'SAIL', name: 'Steel Authority of India Ltd', sector: 'Metals', basePrice: 160, category: 'STOCK', peRatio: 15.4, dividendYield: 1.5, marketCap: 66000, yahooSymbol: 'SAIL.NS' },
  { symbol: 'NMDC', name: 'NMDC Ltd', sector: 'Metals', basePrice: 240, category: 'STOCK', peRatio: 14.1, dividendYield: 2.4, marketCap: 70000, yahooSymbol: 'NMDC.NS' },
  { symbol: 'NATIONALUM', name: 'National Aluminium Co Ltd', sector: 'Metals', basePrice: 180, category: 'STOCK', peRatio: 18.2, dividendYield: 1.8, marketCap: 33000, yahooSymbol: 'NATIONALUM.NS' },
  { symbol: 'TATACOMM', name: 'Tata Communications Ltd', sector: 'Telecom', basePrice: 1800, category: 'STOCK', peRatio: 28.5, dividendYield: 0.9, marketCap: 51000, yahooSymbol: 'TATACOMM.NS' },
  { symbol: 'IDEA', name: 'Vodafone Idea Ltd', sector: 'Telecom', basePrice: 13, category: 'STOCK', peRatio: null, dividendYield: null, marketCap: 65000, yahooSymbol: 'IDEA.NS' },
  { symbol: 'INDUSTOWER', name: 'Indus Towers Ltd', sector: 'Telecom', basePrice: 320, category: 'STOCK', peRatio: 18.4, dividendYield: 1.1, marketCap: 86000, yahooSymbol: 'INDUSTOWER.NS' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Automobile', basePrice: 180, category: 'STOCK', peRatio: 22.4, dividendYield: 2.1, marketCap: 52000, yahooSymbol: 'ASHOKLEY.NS' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd', sector: 'Automobile', basePrice: 2000, category: 'STOCK', peRatio: 54.1, dividendYield: 0.4, marketCap: 95000, yahooSymbol: 'TVSMOTOR.NS' },
  { symbol: 'BALKRISIND', name: 'Balkrishna Industries Ltd', sector: 'Automobile', basePrice: 2400, category: 'STOCK', peRatio: 35.8, dividendYield: 0.6, marketCap: 46000, yahooSymbol: 'BALKRISIND.NS' },
  { symbol: 'MRF', name: 'MRF Ltd', sector: 'Automobile', basePrice: 125000, category: 'STOCK', peRatio: 28.5, dividendYield: 0.1, marketCap: 53000, yahooSymbol: 'MRF.NS' },
  { symbol: 'APOLLOTYRE', name: 'Apollo Tyres Ltd', sector: 'Automobile', basePrice: 480, category: 'STOCK', peRatio: 16.5, dividendYield: 1.2, marketCap: 30000, yahooSymbol: 'APOLLOTYRE.NS' },
  { symbol: 'CEATLTD', name: 'CEAT Ltd', sector: 'Automobile', basePrice: 2500, category: 'STOCK', peRatio: 18.2, dividendYield: 1.0, marketCap: 10000, yahooSymbol: 'CEATLTD.NS' },
  { symbol: 'EXIDEIND', name: 'Exide Industries Ltd', sector: 'Automobile', basePrice: 380, category: 'STOCK', peRatio: 30.2, dividendYield: 0.5, marketCap: 32000, yahooSymbol: 'EXIDEIND.NS' },
  { symbol: 'AMARAJABAT', name: 'Amara Raja Energy & Mobility Ltd', sector: 'Automobile', basePrice: 800, category: 'STOCK', peRatio: 24.1, dividendYield: 0.9, marketCap: 25000, yahooSymbol: 'ARE&M.NS' },
  { symbol: 'BIOCON', name: 'Biocon Ltd', sector: 'Pharma', basePrice: 260, category: 'STOCK', peRatio: 48.2, dividendYield: 0.5, marketCap: 31000, yahooSymbol: 'BIOCON.NS' },
  { symbol: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma', basePrice: 1600, category: 'STOCK', peRatio: 35.1, dividendYield: 0.4, marketCap: 73000, yahooSymbol: 'LUPIN.NS' },

  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd', sector: 'Pharma', basePrice: 1100, category: 'STOCK', peRatio: 21.2, dividendYield: 0.3, marketCap: 64000, yahooSymbol: 'AUROPHARMA.NS' },
  { symbol: 'GLENMARK', name: 'Glenmark Pharmaceuticals Ltd', sector: 'Pharma', basePrice: 1000, category: 'STOCK', peRatio: 38.4, dividendYield: 0.2, marketCap: 28000, yahooSymbol: 'GLENMARK.NS' },
  { symbol: 'ABBOTINDIA', name: 'Abbott India Ltd', sector: 'Pharma', basePrice: 26000, category: 'STOCK', peRatio: 48.5, dividendYield: 1.4, marketCap: 55000, yahooSymbol: 'ABBOTINDIA.NS' },
  { symbol: 'ALKEM', name: 'Alkem Laboratories Ltd', sector: 'Pharma', basePrice: 5000, category: 'STOCK', peRatio: 33.1, dividendYield: 0.7, marketCap: 60000, yahooSymbol: 'ALKEM.NS' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals Ltd', sector: 'Pharma', basePrice: 2600, category: 'STOCK', peRatio: 52.4, dividendYield: 0.8, marketCap: 88000, yahooSymbol: 'TORNTPHARM.NS' },
  { symbol: 'ZYDUSLIFE', name: 'Zydus Lifesciences Ltd', sector: 'Pharma', basePrice: 950, category: 'STOCK', peRatio: 26.4, dividendYield: 0.3, marketCap: 96000, yahooSymbol: 'ZYDUSLIFE.NS' },
  { symbol: 'IPCALAB', name: 'Ipca Laboratories Ltd', sector: 'Pharma', basePrice: 1200, category: 'STOCK', peRatio: 46.1, dividendYield: 0.4, marketCap: 30000, yahooSymbol: 'IPCALAB.NS' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products Ltd', sector: 'FMCG', basePrice: 1250, category: 'STOCK', peRatio: 58.2, dividendYield: 1.1, marketCap: 128000, yahooSymbol: 'GODREJCP.NS' },
  { symbol: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG', basePrice: 530, category: 'STOCK', peRatio: 49.5, dividendYield: 1.8, marketCap: 94000, yahooSymbol: 'DABUR.NS' },
  { symbol: 'MARICO', name: 'Marico Ltd', sector: 'FMCG', basePrice: 520, category: 'STOCK', peRatio: 51.4, dividendYield: 1.7, marketCap: 67000, yahooSymbol: 'MARICO.NS' },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive (India) Ltd', sector: 'FMCG', basePrice: 2600, category: 'STOCK', peRatio: 56.4, dividendYield: 1.6, marketCap: 70000, yahooSymbol: 'COLPAL.NS' },
  { symbol: 'UBL', name: 'United Breweries Ltd', sector: 'FMCG', basePrice: 1800, category: 'STOCK', peRatio: 84.1, dividendYield: 0.5, marketCap: 48000, yahooSymbol: 'UBL.NS' },
  { symbol: 'MCDOWELL-N', name: 'United Spirits Ltd (McDowell)', sector: 'FMCG', basePrice: 1150, category: 'STOCK', peRatio: 64.2, dividendYield: 0.6, marketCap: 83000, yahooSymbol: 'MCDOWELL-N.NS' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', sector: 'FMCG', basePrice: 1100, category: 'STOCK', peRatio: 68.4, dividendYield: 0.7, marketCap: 105000, yahooSymbol: 'TATACONSUM.NS' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', sector: 'FMCG', basePrice: 2800, category: 'STOCK', peRatio: 72.1, dividendYield: 0.4, marketCap: 142000, yahooSymbol: 'PIDILITIND.NS' },
  { symbol: 'BERGEPAINT', name: 'Berger Paints India Ltd', sector: 'Consumer Goods', basePrice: 550, category: 'STOCK', peRatio: 62.4, dividendYield: 0.6, marketCap: 53000, yahooSymbol: 'BERGEPAINT.NS' },
  { symbol: 'CONCOR', name: 'Container Corporation of India', sector: 'Logistics', basePrice: 950, category: 'STOCK', peRatio: 36.4, dividendYield: 1.1, marketCap: 58000, yahooSymbol: 'CONCOR.NS' },
  { symbol: 'GMRINFRA', name: 'GMR Airports Infrastructure Ltd', sector: 'Infrastructure', basePrice: 85, category: 'STOCK', peRatio: null, dividendYield: null, marketCap: 51000, yahooSymbol: 'GMRINFRA.NS' },
  { symbol: 'IRCTC', name: 'Indian Railway Catering & Tourism', sector: 'Services', basePrice: 950, category: 'STOCK', peRatio: 58.2, dividendYield: 1.2, marketCap: 76000, yahooSymbol: 'IRCTC.NS' },
  { symbol: 'RECLTD', name: 'REC Ltd', sector: 'Financial Services', basePrice: 450, category: 'STOCK', peRatio: 9.8, dividendYield: 3.5, marketCap: 118000, yahooSymbol: 'RECLTD.NS' },
  { symbol: 'PFC', name: 'Power Finance Corporation Ltd', sector: 'Financial Services', basePrice: 400, category: 'STOCK', peRatio: 8.4, dividendYield: 3.8, marketCap: 132000, yahooSymbol: 'PFC.NS' },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', sector: 'Financial Services', basePrice: 1400, category: 'STOCK', peRatio: 14.2, dividendYield: 1.6, marketCap: 56000, yahooSymbol: 'MUTHOOTFIN.NS' },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment & Finance', sector: 'Financial Services', basePrice: 1150, category: 'STOCK', peRatio: 31.4, dividendYield: 0.2, marketCap: 96000, yahooSymbol: 'CHOLAFIN.NS' },
  { symbol: 'SRF', name: 'SRF Ltd', sector: 'Industrial', basePrice: 2300, category: 'STOCK', peRatio: 34.5, dividendYield: 0.3, marketCap: 68000, yahooSymbol: 'SRF.NS' },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power Ltd', sector: 'Metals', basePrice: 850, category: 'STOCK', peRatio: 16.4, dividendYield: 0.2, marketCap: 86000, yahooSymbol: 'JINDALSTEL.NS' },
  { symbol: 'DLF', name: 'DLF Ltd', sector: 'Real Estate', basePrice: 850, category: 'STOCK', peRatio: 52.1, dividendYield: 0.5, marketCap: 210000, yahooSymbol: 'DLF.NS' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', sector: 'Real Estate', basePrice: 2200, category: 'STOCK', peRatio: 90.2, dividendYield: null, marketCap: 61000, yahooSymbol: 'GODREJPROP.NS' },
  { symbol: 'OBEROIRLTY', name: 'Oberoi Realty Ltd', sector: 'Real Estate', basePrice: 1400, category: 'STOCK', peRatio: 34.5, dividendYield: 0.3, marketCap: 51000, yahooSymbol: 'OBEROIRLTY.NS' },
  { symbol: 'SOBHA', name: 'Sobha Ltd', sector: 'Real Estate', basePrice: 1500, category: 'STOCK', peRatio: 84.5, dividendYield: 0.2, marketCap: 14000, yahooSymbol: 'SOBHA.NS' },
  { symbol: 'TRENT', name: 'Trent Ltd', sector: 'Consumer Goods', basePrice: 4000, category: 'STOCK', peRatio: 142.1, dividendYield: 0.1, marketCap: 142000, yahooSymbol: 'TRENT.NS' },

  // ETFs (NSE)
  { symbol: 'NIFTYBEES', name: 'Nippon India Nifty 50 ETF', sector: 'Exchange Traded Fund', basePrice: 250, category: 'ETF', peRatio: null, dividendYield: 0.6, marketCap: 18000, yahooSymbol: 'NIFTYBEES.NS' },
  { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', sector: 'Exchange Traded Fund', basePrice: 120, category: 'ETF', peRatio: null, dividendYield: null, marketCap: 9500, yahooSymbol: 'GOLDBEES.NS' },
  { symbol: 'JUNIORBEES', name: 'Nippon India Nifty Next 50 ETF', sector: 'Exchange Traded Fund', basePrice: 700, category: 'ETF', peRatio: null, dividendYield: 0.5, marketCap: 3000, yahooSymbol: 'JUNIORBEES.NS' },
  { symbol: 'BANKBEES', name: 'Nippon India Nifty Bank ETF', sector: 'Exchange Traded Fund', basePrice: 480, category: 'ETF', peRatio: null, dividendYield: null, marketCap: 8500, yahooSymbol: 'BANKBEES.NS' },
  { symbol: 'LIQUIDBEES', name: 'Nippon India Liquid ETF', sector: 'Exchange Traded Fund', basePrice: 1000, category: 'ETF', peRatio: null, dividendYield: 2.8, marketCap: 15000, yahooSymbol: 'LIQUIDBEES.NS' },

  // Forex
  { symbol: 'USDINR', name: 'US Dollar / Indian Rupee', sector: 'Currency', basePrice: 83.5, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null, yahooSymbol: 'USDINR=X' },
  { symbol: 'EURINR', name: 'Euro / Indian Rupee', sector: 'Currency', basePrice: 90.2, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null, yahooSymbol: 'EURINR=X' },
  { symbol: 'GBPINR', name: 'British Pound / Indian Rupee', sector: 'Currency', basePrice: 105.4, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null, yahooSymbol: 'GBPINR=X' },
  { symbol: 'JPYINR', name: 'Japanese Yen / Indian Rupee', sector: 'Currency', basePrice: 0.55, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null, yahooSymbol: 'JPYINR=X' },
  { symbol: 'SGDINR', name: 'Singapore Dollar / Indian Rupee', sector: 'Currency', basePrice: 61.8, category: 'FOREX', peRatio: null, dividendYield: null, marketCap: null, yahooSymbol: 'SGDINR=X' },

  // Crypto
  { symbol: 'BTCINR', name: 'Bitcoin / Indian Rupee', sector: 'Cryptocurrency', basePrice: 5800000, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 110000000, yahooSymbol: 'BTC-INR' },
  { symbol: 'ETHINR', name: 'Ethereum / Indian Rupee', sector: 'Cryptocurrency', basePrice: 300000, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 36000000, yahooSymbol: 'ETH-INR' },
  { symbol: 'SOLINR', name: 'Solana / Indian Rupee', sector: 'Cryptocurrency', basePrice: 12000, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 5000000, yahooSymbol: 'SOL-INR' },
  { symbol: 'XRPINR', name: 'Ripple / Indian Rupee', sector: 'Cryptocurrency', basePrice: 45, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 2500000, yahooSymbol: 'XRP-INR' },
  { symbol: 'ADAINR', name: 'Cardano / Indian Rupee', sector: 'Cryptocurrency', basePrice: 40, category: 'CRYPTO', peRatio: null, dividendYield: null, marketCap: 1200000, yahooSymbol: 'ADA-INR' },

  // Indices
  { symbol: 'NIFTY50', name: 'Nifty 50 Index', sector: 'Index', basePrice: 22500, category: 'INDEX', peRatio: 22.8, dividendYield: 1.2, marketCap: null, yahooSymbol: '^NSEI' },
  { symbol: 'SENSEX', name: 'BSE Sensex Index', sector: 'Index', basePrice: 74000, category: 'INDEX', peRatio: 23.4, dividendYield: 1.1, marketCap: null, yahooSymbol: '^BSESN' },
  { symbol: 'NIFTYBANK', name: 'Nifty Bank Index', sector: 'Index', basePrice: 48000, category: 'INDEX', peRatio: 15.8, dividendYield: 0.9, marketCap: null, yahooSymbol: '^NSEBANK' },
  { symbol: 'NIFTYIT', name: 'Nifty IT Index', sector: 'Index', basePrice: 35000, category: 'INDEX', peRatio: 28.2, dividendYield: 2.1, marketCap: null, yahooSymbol: '^CNXIT' },
  { symbol: 'NIFTYPHARMA', name: 'Nifty Pharma Index', sector: 'Index', basePrice: 18000, category: 'INDEX', peRatio: 31.4, dividendYield: 0.7, marketCap: null, yahooSymbol: '^CNXPHARMA' }
];

/**
 * Main seeding function
 * @param {Boolean} clearDB - If true, clears the Stocks collection before seeding
 * @param {Boolean} shouldExit - If true, disconnects and calls process.exit()
 */
const seedStocks = async (clearDB = true, shouldExit = false) => {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        console.error('MONGO_URI not found in environment.');
        if (shouldExit) process.exit(1);
        return;
      }

      console.log('Connecting to MongoDB...');
      await mongoose.connect(mongoUri, { dbName: 'stock_simulator' });
      console.log('MongoDB connected successfully');
    }

    if (clearDB) {
      // Clear existing stocks
      const deletedCount = await Stock.deleteMany({});
      console.log(`Cleared ${deletedCount.deletedCount} existing stocks`);
    }

    console.log(`\nSeeding ${STOCKS.length} diversified assets with historical data from Yahoo Finance...\n`);

    // Date range for 365 days of historical data
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 1);
    const period2 = new Date();

    const queryOptions = {
      period1,
      period2,
      interval: '1d'
    };

    // We process requests with a concurrency limit of 5 to avoid overloading
    const concurrencyLimit = 5;
    const results = [];

    for (let i = 0; i < STOCKS.length; i += concurrencyLimit) {
      const chunk = STOCKS.slice(i, i + concurrencyLimit);
      console.log(`Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(STOCKS.length / concurrencyLimit)}...`);

      const promises = chunk.map(async (stockData) => {
        let ohlcvData = [];
        let fetchSuccess = false;

        try {
          const rawHistory = await yahooFinance.chart(stockData.yahooSymbol, queryOptions);
          if (rawHistory && rawHistory.quotes && rawHistory.quotes.length > 0) {
            ohlcvData = rawHistory.quotes
              .filter(candle => candle.open !== undefined && candle.close !== undefined)
              .map(candle => ({
                date: new Date(candle.date),
                open: Math.max(0.01, Math.round(candle.open * 100) / 100),
                high: Math.max(0.01, Math.round((candle.high || candle.open) * 100) / 100),
                low: Math.max(0.01, Math.round((candle.low || candle.open) * 100) / 100),
                close: Math.max(0.01, Math.round(candle.close * 100) / 100),
                volume: candle.volume || 0
              }));

            if (ohlcvData.length > 0) {
              fetchSuccess = true;
            }
          }
        } catch (err) {
          console.warn(`  ⚠️  Yahoo Finance fetch failed for ${stockData.symbol}: ${err.message}`);
        }

        // Fallback to simulation if Yahoo Finance fetch failed or returned empty data
        if (!fetchSuccess) {
          ohlcvData = seedHistoricalData(stockData.symbol, 365, stockData.basePrice);
        }

        // Calculate current price & price metrics
        const lastCandle = ohlcvData[ohlcvData.length - 1];
        const currentPrice = lastCandle.close;

        const prevCandle = ohlcvData.length >= 2 ? ohlcvData[ohlcvData.length - 2] : lastCandle;
        const change = Math.round((currentPrice - prevCandle.close) * 100) / 100;
        const changePercent = Math.round((change / prevCandle.close) * 10000) / 100;

        // Create/Update stock document in MongoDB
        const stock = await Stock.findOneAndUpdate(
          { symbol: stockData.symbol },
          {
            symbol: stockData.symbol,
            name: stockData.name,
            sector: stockData.sector,
            market: stockData.category === 'FOREX' || stockData.category === 'CRYPTO' ? 'GLOBAL' : 'NSE',
            currentPrice,
            change,
            changePercent,
            category: stockData.category || 'STOCK',
            peRatio: stockData.peRatio || null,
            dividendYield: stockData.dividendYield || null,
            marketCap: stockData.marketCap || null,
            volume: lastCandle.volume || 0,
            ohlcv: ohlcvData,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`  ✓ ${stock.symbol}: ₹${currentPrice} (${changePercent >= 0 ? '+' : ''}${changePercent}%) | Source: ${fetchSuccess ? 'Yahoo Finance' : 'Simulation'} (${ohlcvData.length} candles)`);
        return stock;
      });

      await Promise.all(promises);
      // Brief pause between batches to prevent rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n✅ Successfully seeded ${STOCKS.length} assets!`);

    if (shouldExit) {
      console.log('Stock seeding complete. Disconnecting...\n');
      await mongoose.disconnect();
      console.log('MongoDB disconnected. Seeder finished.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeder error:', error.message);
    console.error(error.stack);
    if (shouldExit) {
      await mongoose.disconnect();
      process.exit(1);
    }
  }
};

// Check if run directly
if (require.main === module) {
  seedStocks(true, true);
} else {
  module.exports = seedStocks;
}
