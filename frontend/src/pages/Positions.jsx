import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTarget, FiTrendingUp, FiTrendingDown, FiArrowRight } from 'react-icons/fi';
import { fetchPortfolio, placeOrder, fetchWallet } from '../store/portfolioSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getStockIcon } from '../utils/stockIcons';
import toast from 'react-hot-toast';

export default function Positions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { holdings: rawHoldings, loading } = useSelector((state) => state.portfolio);
  const { stocks } = useSelector((state) => state.market);

  useEffect(() => {
    dispatch(fetchPortfolio());
  }, [dispatch]);

  // Merge live prices into holdings
  const positions = useMemo(() => {
    return (rawHoldings || []).map((h) => {
      const stock = stocks.find((s) => s.symbol === h.symbol);
      const currentPrice = stock ? stock.currentPrice : h.avgPrice;
      const qty = Number(h.qty || h.quantity || 0);
      const avgPrice = Number(h.avgPrice || 0);
      const investedValue = avgPrice * qty;
      const currentValue = currentPrice * qty;
      const unrealizedPnL = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? (unrealizedPnL / investedValue) * 100 : 0;
      const dayChange = stock ? (stock.change || 0) * qty : 0;
      const dayChangePercent = stock ? stock.changePercent || 0 : 0;

      return {
        ...h,
        currentPrice,
        qty,
        avgPrice,
        investedValue,
        currentValue,
        unrealizedPnL,
        pnlPercent,
        dayChange,
        dayChangePercent,
        stockName: stock?.name || h.symbol,
      };
    });
  }, [rawHoldings, stocks]);

  // Summary calculations
  const totalInvested = positions.reduce((sum, p) => sum + p.investedValue, 0);
  const totalCurrent = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalUnrealized = totalCurrent - totalInvested;
  const totalDayChange = positions.reduce((sum, p) => sum + p.dayChange, 0);
  const overallPnlPercent = totalInvested > 0 ? (totalUnrealized / totalInvested) * 100 : 0;

  const handleClosePosition = async (e, pos) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to close your position in ${pos.symbol} by selling all ${pos.qty} shares at market price?`)) {
      try {
        await dispatch(placeOrder({
          symbol: pos.symbol,
          type: 'SELL',
          qty: pos.qty,
          orderMode: 'MARKET'
        })).unwrap();
        toast.success(`Closed position in ${pos.symbol}: Sold ${pos.qty} shares`);
        dispatch(fetchPortfolio());
        dispatch(fetchWallet());
      } catch (err) {
        toast.error(err || 'Failed to close position');
      }
    }
  };

  if (loading && positions.length === 0) {
    return <LoadingSpinner size="lg" text="Loading positions..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FiTarget className="text-slate-700 dark:text-slate-400" size={22} />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Positions</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Open positions with live unrealized P&L
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent"
        >
          <p className="stat-label mb-2 dark:text-slate-400">Invested</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-white">
            ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent"
        >
          <p className="stat-label mb-2 dark:text-slate-400">Current Value</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-white">
            ₹{totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass-card p-5 bg-gradient-to-br ${totalUnrealized >= 0 ? 'from-green-50/50 dark:from-green-950/20' : 'from-red-50/50 dark:from-red-950/20'} to-transparent`}
        >
          <p className="stat-label mb-2 dark:text-slate-400">Unrealized P&L</p>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${totalUnrealized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {totalUnrealized >= 0 ? '+' : ''}₹{totalUnrealized.toFixed(2)}
          </p>
          <p className={`text-xs font-bold mt-1 ${overallPnlPercent >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-450'}`}>
            {overallPnlPercent >= 0 ? '+' : ''}{overallPnlPercent.toFixed(2)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`glass-card p-5 bg-gradient-to-br ${totalDayChange >= 0 ? 'from-green-50/50 dark:from-green-950/20' : 'from-red-50/50 dark:from-red-950/20'} to-transparent`}
        >
          <p className="stat-label mb-2 dark:text-slate-400">Today's Change</p>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${totalDayChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {totalDayChange >= 0 ? '+' : ''}₹{totalDayChange.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Positions Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            Open Positions ({positions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Stock</th>
                <th className="py-4 px-5 text-right">Qty</th>
                <th className="py-4 px-5 text-right">Avg Price</th>
                <th className="py-4 px-5 text-right">LTP</th>
                <th className="py-4 px-5 text-right">Invested</th>
                <th className="py-4 px-5 text-right">Current Value</th>
                <th className="py-4 px-5 text-right">Day P&L</th>
                <th className="py-4 px-5 text-right">Unrealized P&L</th>
                <th className="py-4 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <FiTarget className="mx-auto mb-3 text-slate-300" size={32} />
                    <p className="text-sm text-slate-400 font-semibold">No open positions</p>
                    <p className="text-xs text-slate-400 mt-1">Buy stocks to open new positions</p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-4 btn-primary text-xs py-2 px-4"
                    >
                      Explore Stocks
                    </button>
                  </td>
                </tr>
              ) : (
                positions.map((pos, idx) => {
                  const isPos = pos.unrealizedPnL >= 0;
                  const isDayPos = pos.dayChange >= 0;

                  return (
                    <motion.tr
                      key={pos.symbol}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => navigate(`/trade/${pos.symbol}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                            isPos ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                          }`}>
                            {getStockIcon(pos.symbol)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-white text-sm">{pos.symbol}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[120px]">{pos.stockName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-800 dark:text-white">{pos.qty}</td>
                      <td className="py-4 px-5 text-right font-mono text-slate-600 dark:text-slate-300">₹{pos.avgPrice.toFixed(2)}</td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-800 dark:text-white">₹{Number(pos.currentPrice).toFixed(2)}</td>
                      <td className="py-4 px-5 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₹{pos.investedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-800 dark:text-white">
                        ₹{pos.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className={`font-mono font-bold ${isDayPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {isDayPos ? '+' : ''}₹{pos.dayChange.toFixed(2)}
                        </span>
                        <span className={`block text-[10px] font-bold ${isDayPos ? 'text-green-550' : 'text-red-400'}`}>
                          {isDayPos ? '+' : ''}{pos.dayChangePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className={`font-mono font-bold ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {isPos ? '+' : ''}₹{pos.unrealizedPnL.toFixed(2)}
                        </span>
                        <span className={`block text-[10px] font-bold ${isPos ? 'text-green-550' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={(e) => handleClosePosition(e, pos)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40 font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Square Off
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
