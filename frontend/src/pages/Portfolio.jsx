import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiTrendingUp, FiTrendingDown, FiFilter, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import TradeHistory from '../components/trading/TradeHistory';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PortfolioPieChart from '../components/charts/PortfolioPieChart';
import PnLBarChart from '../components/charts/PnLBarChart';
import { fetchPortfolio, fetchTradeHistory } from '../store/portfolioSlice';
import { getStockIcon } from '../utils/stockIcons';

export default function Portfolio() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { holdings: rawHoldings, tradeHistory, loading } = useSelector((state) => state.portfolio);
  const { stocks } = useSelector((state) => state.market);

  const { holdings, totalValue, totalPnL } = useMemo(() => {
    let totalValue = 0;
    let totalInvested = 0;

    const holdings = (rawHoldings || []).map(h => {
      const stock = stocks.find(s => s.symbol === h.symbol);
      const currentPrice = stock ? stock.currentPrice : h.avgPrice;
      const investedValue = h.avgPrice * h.qty;
      const currentValue = currentPrice * h.qty;
      const pnl = currentValue - investedValue;
      const pnlPercent = h.avgPrice > 0 ? (pnl / investedValue) * 100 : 0;

      totalInvested += investedValue;
      totalValue += currentValue;

      return {
        ...h,
        currentPrice,
        investedValue,
        currentValue,
        pnl,
        pnlPercent
      };
    });

    const totalPnL = totalValue - totalInvested;
    return {
      holdings,
      totalValue,
      totalPnL
    };
  }, [rawHoldings, stocks]);
  const [sortField, setSortField] = useState('value');
  const [sortDir, setSortDir] = useState('desc');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    dispatch(fetchPortfolio());
    dispatch(fetchTradeHistory());
  }, [dispatch]);

  const isPnLPositive = totalPnL >= 0;

  const sortedHoldings = [...(holdings || [])].sort((a, b) => {
    let aVal, bVal;
    const aQty = Number(a.qty || a.quantity || 0);
    const bQty = Number(b.qty || b.quantity || 0);
    const aPrice = Number(a.currentPrice || a.avgPrice || 0);
    const bPrice = Number(b.currentPrice || b.avgPrice || 0);

    switch (sortField) {
      case 'symbol': return sortDir === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      case 'qty': aVal = aQty; bVal = bQty; break;
      case 'avgPrice': aVal = Number(a.avgPrice || 0); bVal = Number(b.avgPrice || 0); break;
      case 'currentPrice': aVal = aPrice; bVal = bPrice; break;
      case 'pnl': aVal = Number(a.pnl || 0); bVal = Number(b.pnl || 0); break;
      default: aVal = aQty * aPrice; bVal = bQty * bPrice;
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />;
  };

  const filteredTrades = filterType === 'all'
    ? tradeHistory
    : tradeHistory.filter((t) => t.type === filterType);

  if (loading && holdings.length === 0) {
    return <LoadingSpinner size="lg" text="Loading portfolio..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiBriefcase className="text-slate-700 dark:text-slate-400" size={20} />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Portfolio</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your investments and performance</p>
        </div>
      </div>

      {/* Portfolio Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 bg-gradient-to-br from-primary-500/10 to-transparent dark:from-primary-500/5 dark:to-transparent"
        >
          <p className="stat-label mb-2 dark:text-slate-400">Portfolio Value</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-white">
            ₹{Number(totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass-card p-5 bg-gradient-to-br ${isPnLPositive ? 'from-green-50/50 dark:from-green-950/20' : 'from-red-50/50 dark:from-red-950/20'} to-transparent`}
        >
          <p className="stat-label mb-2 dark:text-slate-400">Total P&L</p>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${isPnLPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPnLPositive ? '+' : ''}₹{Number(totalPnL || 0).toFixed(2)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-950/20 to-transparent"
        >
          <p className="stat-label mb-2 dark:text-slate-400">Holdings</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-white">
            {holdings.length}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{tradeHistory.length} total trades</p>
        </motion.div>
      </div>

      {/* Visual Analytics */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Asset Allocation</h3>
            <PortfolioPieChart holdings={holdings} />
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Profit & Loss Comparison</h3>
            <PnLBarChart holdings={holdings} />
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-850">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Your Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th onClick={() => toggleSort('symbol')} className="px-4 py-3 text-left cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1">Stock <SortIcon field="symbol" /></span>
                </th>
                <th onClick={() => toggleSort('qty')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1 justify-end">Qty <SortIcon field="qty" /></span>
                </th>
                <th onClick={() => toggleSort('avgPrice')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1 justify-end">Avg Price <SortIcon field="avgPrice" /></span>
                </th>
                <th onClick={() => toggleSort('currentPrice')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1 justify-end">Current Price <SortIcon field="currentPrice" /></span>
                </th>
                <th onClick={() => toggleSort('value')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1 justify-end">Value <SortIcon field="value" /></span>
                </th>
                <th onClick={() => toggleSort('pnl')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1 justify-end">P&L <SortIcon field="pnl" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-600 dark:text-slate-350">
              {sortedHoldings.length > 0 ? sortedHoldings.map((holding, idx) => {
                const qty = Number(holding.qty || holding.quantity || 0);
                const avgPrice = Number(holding.avgPrice || 0);
                const currentPrice = Number(holding.currentPrice || avgPrice);
                const value = qty * currentPrice;
                const pnl = Number(holding.pnl || (currentPrice - avgPrice) * qty);
                const pnlPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
                const isPositive = pnl >= 0;

                return (
                  <motion.tr
                    key={holding.symbol || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(`/trade/${holding.symbol}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          isPositive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {getStockIcon(holding.symbol)}
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-white text-sm">{holding.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-700 dark:text-slate-200">{qty}</td>
                    <td className="px-4 py-4 text-right font-mono text-slate-650 dark:text-slate-400">₹{avgPrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">₹{currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className={`font-mono font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isPositive ? '+' : ''}₹{pnl.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </div>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    <FiBriefcase className="mx-auto mb-2 text-slate-300 dark:text-slate-650" size={24} />
                    <p>No holdings yet. Start trading to build your portfolio!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Trade History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-slate-400 dark:text-slate-500" size={16} />
          <div className="flex items-center gap-1">
            {['all', 'BUY', 'SELL'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  filterType === type
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>
        <TradeHistory trades={filteredTrades} title="Trade History" />
      </div>
    </motion.div>
  );
}
