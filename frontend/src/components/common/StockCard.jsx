import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { getStockIcon } from '../../utils/stockIcons';

export default function StockCard({ stock, index = 0, compact = false }) {
  const navigate = useNavigate();
  const isPositive = (stock.change || 0) >= 0;

  const handleClick = () => {
    navigate(`/trade/${stock.symbol}`);
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={handleClick}
        className="flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-200 group"
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
            <p className="text-xs text-gray-500 truncate max-w-[100px]">{stock.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold font-mono">₹{Number(stock.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={`text-xs font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={handleClick}
      className="glass-card-hover p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
            isPositive ? 'bg-gain/10 text-gain border border-gain/20' : 'bg-loss/10 text-loss border border-loss/20'
          }`}>
            {getStockIcon(stock.symbol)}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
              {stock.symbol}
            </h3>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{stock.name}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
          isPositive ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
        }`}>
          {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
          {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="text-xl font-bold font-mono tracking-tight">
            ₹{Number(stock.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? '+' : ''}₹{Number(stock.change || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {stock.sector && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md">{stock.sector}</span>
        </div>
      )}
    </motion.div>
  );
}
