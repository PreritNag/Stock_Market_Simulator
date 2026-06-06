import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { fetchPortfolio } from '../../store/portfolioSlice';

export default function PortfolioSummary() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { holdings: rawHoldings } = useSelector((state) => state.portfolio);
  const { stocks } = useSelector((state) => state.market);

  const { holdings, totalValue, totalPnL } = useMemo(() => {
    let totalValue = 0;
    let totalInvested = 0;

    const holdings = (rawHoldings || []).map(h => {
      const stock = stocks.find(s => s.symbol === h.symbol);
      const currentPrice = stock ? stock.currentPrice : h.avgPrice;
      const investedValue = h.avgPrice * h.qty;
      const currentValue = currentPrice * h.qty;

      totalInvested += investedValue;
      totalValue += currentValue;

      return {
        ...h,
        currentPrice,
        currentValue,
        investedValue
      };
    });

    const totalPnL = totalValue - totalInvested;
    return {
      holdings,
      totalValue,
      totalPnL
    };
  }, [rawHoldings, stocks]);

  useEffect(() => {
    dispatch(fetchPortfolio());
  }, [dispatch]);

  const isPnLPositive = totalPnL >= 0;

  // Calculate allocation for donut-style display
  const allocations = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];
    const total = holdings.reduce((sum, h) => sum + (Number(h.currentValue || h.qty * h.currentPrice || 0)), 0);
    if (total === 0) return [];

    const colors = [
      '#0ea5e9', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
    ];

    return holdings.slice(0, 10).map((h, idx) => {
      const value = Number(h.currentValue || (h.qty || h.quantity || 0) * (h.currentPrice || h.avgPrice || 0));
      return {
        symbol: h.symbol,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color: colors[idx % colors.length],
      };
    });
  }, [holdings]);

  // SVG donut chart
  const DonutChart = () => {
    if (allocations.length === 0) {
      return (
        <div className="w-32 h-32 rounded-full border-4 border-surface-200 flex items-center justify-center">
          <FiBriefcase className="text-gray-600" size={24} />
        </div>
      );
    }

    let cumulativePercent = 0;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="transform -rotate-90 w-full h-full">
          {allocations.map((alloc, idx) => {
            const strokeDash = (alloc.percent / 100) * circumference;
            const offset = circumference - (cumulativePercent / 100) * circumference;
            cumulativePercent += alloc.percent;

            return (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={alloc.color}
                strokeWidth="10"
                strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                strokeDashoffset={-((cumulativePercent - alloc.percent) / 100) * circumference}
                className="transition-all duration-700"
                style={{ opacity: 0.8 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-400">Total</span>
          <span className="text-sm font-bold font-mono text-white">
            {holdings.length}
          </span>
          <span className="text-xs text-gray-500">stocks</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiBriefcase className="text-primary-400" size={16} />
          <h3 className="text-sm font-semibold text-white">Portfolio Summary</h3>
        </div>
        <button
          onClick={() => navigate('/portfolio')}
          className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          View All →
        </button>
      </div>

      <div className="p-5">
        {/* Total Value */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Portfolio Value</p>
            <p className="text-3xl font-bold font-mono tracking-tight text-white">
              ₹{Number(totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 mt-1 ${isPnLPositive ? 'text-gain' : 'text-loss'}`}>
              {isPnLPositive ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
              <span className="text-sm font-semibold">
                {isPnLPositive ? '+' : ''}₹{Number(totalPnL || 0).toFixed(2)}
              </span>
              <span className="text-xs opacity-70">
                ({isPnLPositive ? '+' : ''}{totalValue > 0 ? ((totalPnL / totalValue) * 100).toFixed(2) : '0.00'}%)
              </span>
            </div>
          </div>
          <DonutChart />
        </div>

        {/* Top Holdings */}
        {allocations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs text-gray-400 uppercase tracking-wider font-medium">Holdings</h4>
            {allocations.slice(0, 5).map((alloc, idx) => (
              <motion.div
                key={alloc.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/trade/${alloc.symbol}`)}
                className="flex items-center justify-between py-2 cursor-pointer hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: alloc.color }} />
                  <span className="text-sm font-medium text-white">{alloc.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-300">
                    ₹{alloc.value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-gray-500 w-12 text-right">{alloc.percent.toFixed(1)}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {allocations.length === 0 && (
          <div className="text-center py-6">
            <FiDollarSign className="mx-auto text-gray-600 mb-2" size={24} />
            <p className="text-sm text-gray-500">No holdings yet</p>
            <p className="text-xs text-gray-600 mt-1">Start trading to build your portfolio</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
