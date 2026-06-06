import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';

export default function MarketOverview() {
  const { stocks } = useSelector((state) => state.market);
  const navigate = useNavigate();

  const { gainers, losers, active } = useMemo(() => {
    const sorted = [...stocks].sort(
      (a, b) => (b.changePercent || 0) - (a.changePercent || 0)
    );
    return {
      gainers: sorted.filter((s) => (s.changePercent || 0) > 0).slice(0, 5),
      losers: sorted.filter((s) => (s.changePercent || 0) < 0).slice(-5).reverse(),
      active: [...stocks].sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0)).slice(0, 5),
    };
  }, [stocks]);

  const StockRow = ({ stock, index, type }) => {
    const isPositive = (stock.changePercent || 0) >= 0;
    return (
      <motion.div
        initial={{ opacity: 0, x: type === 'gainer' ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => navigate(`/trade/${stock.symbol}`)}
        className="flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono w-4">{index + 1}</span>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">
              {stock.symbol}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[80px]">{stock.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono font-medium text-gray-200">
            ₹{Number(stock.currentPrice || 0).toFixed(2)}
          </p>
          <p className={`text-xs font-semibold flex items-center gap-1 justify-end ${
            isPositive ? 'text-gain' : 'text-loss'
          }`}>
            {isPositive ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
            {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
          </p>
        </div>
      </motion.div>
    );
  };

  const sections = [
    { title: 'Top Gainers', icon: FiTrendingUp, data: gainers, type: 'gainer', color: 'text-gain', bgColor: 'bg-gain/5', borderColor: 'border-gain/10' },
    { title: 'Top Losers', icon: FiTrendingDown, data: losers, type: 'loser', color: 'text-loss', bgColor: 'bg-loss/5', borderColor: 'border-loss/10' },
    { title: 'Most Active', icon: FiActivity, data: active, type: 'active', color: 'text-primary-400', bgColor: 'bg-primary-500/5', borderColor: 'border-primary-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sections.map((section) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className={`px-4 py-3 border-b border-white/5 flex items-center gap-2 ${section.bgColor}`}>
            <section.icon className={section.color} size={16} />
            <h3 className={`text-sm font-semibold ${section.color}`}>{section.title}</h3>
          </div>
          <div className="p-2">
            {section.data.length > 0 ? (
              section.data.map((stock, idx) => (
                <StockRow key={stock.symbol} stock={stock} index={idx} type={section.type} />
              ))
            ) : (
              <div className="py-8 text-center text-gray-500 text-xs">No data</div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
