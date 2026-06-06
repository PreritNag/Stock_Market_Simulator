import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { getStockIcon } from '../../utils/stockIcons';

export default function WatchlistPanel() {
  const { stocks } = useSelector((state) => state.market);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [flashMap, setFlashMap] = useState({});
  const prevPricesRef = useRef({});

  // Detect price changes for flash animation
  useEffect(() => {
    const newFlash = {};
    stocks.forEach((stock) => {
      const prev = prevPricesRef.current[stock.symbol];
      if (prev !== undefined && prev !== stock.currentPrice) {
        newFlash[stock.symbol] = stock.currentPrice > prev ? 'green' : 'red';
      }
      prevPricesRef.current[stock.symbol] = stock.currentPrice;
    });

    if (Object.keys(newFlash).length > 0) {
      setFlashMap(newFlash);
      const timer = setTimeout(() => setFlashMap({}), 600);
      return () => clearTimeout(timer);
    }
  }, [stocks]);

  const watchlistSymbols = user?.watchlist || [];
  const watchlistStocks = stocks.filter(stock => 
    watchlistSymbols.some((w) => w.toUpperCase() === stock.symbol.toUpperCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card overflow-hidden h-full"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Watchlist</h3>
        <span className="text-xs text-gray-500">{watchlistStocks.length} stocks</span>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {watchlistStocks.map((stock, index) => {
          const isPositive = (stock.change || 0) >= 0;
          const flash = flashMap[stock.symbol];

          return (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigate(`/trade/${stock.symbol}`)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-all duration-200 group ${
                flash === 'green' ? 'animate-flash-green' : flash === 'red' ? 'animate-flash-red' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  isPositive ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                }`}>
                  {getStockIcon(stock.symbol)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">
                    {stock.symbol}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[80px]">{stock.name}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-white">
                  ₹{Number(stock.currentPrice || 0).toFixed(2)}
                </p>
                <div className={`flex items-center justify-end gap-1 text-xs font-medium ${
                  isPositive ? 'text-gain' : 'text-loss'
                }`}>
                  {isPositive ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
                  {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                </div>
              </div>
            </motion.div>
          );
        })}

        {watchlistStocks.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500 text-sm">
            No stocks available
          </div>
        )}
      </div>
    </motion.div>
  );
}
