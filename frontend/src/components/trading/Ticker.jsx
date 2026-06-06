import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function Ticker() {
  const { stocks } = useSelector((state) => state.market);
  const navigate = useNavigate();

  if (!stocks || stocks.length === 0) return null;

  // Duplicate list to ensure seamless looping marquee
  const tickerItems = [...stocks, ...stocks, ...stocks];

  return (
    <div className="w-full bg-[#0a0c14] border-b border-white/5 py-2 overflow-hidden whitespace-nowrap select-none">
      <motion.div
        animate={{ x: [0, -1500] }}
        transition={{
          ease: 'linear',
          duration: 40,
          repeat: Infinity,
        }}
        className="inline-flex gap-8 px-4"
      >
        {tickerItems.map((stock, idx) => {
          const isPositive = (stock.change || 0) >= 0;
          return (
            <div
              key={`${stock.symbol}-${idx}`}
              onClick={() => navigate(`/trade/${stock.symbol}`)}
              className="inline-flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
            >
              <span className="text-xs font-bold text-white tracking-wider">{stock.symbol}</span>
              <span className="text-xs font-mono font-medium text-gray-300">
                ₹{Number(stock.currentPrice || 0).toFixed(2)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                  isPositive ? 'text-gain' : 'text-loss'
                }`}
              >
                {isPositive ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
                {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
