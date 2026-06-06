import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiSearch, FiTrash2, FiTrendingUp, FiTrendingDown, FiPlus, FiEye } from 'react-icons/fi';
import { removeFromWatchlist } from '../store/authSlice';
import { getStockIcon } from '../utils/stockIcons';

export default function Watchlists() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { stocks } = useSelector((state) => state.market);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');

  const watchlistSymbols = user?.watchlist || [];

  const watchlistStocks = useMemo(() => {
    let list = stocks.filter((s) => 
      watchlistSymbols.some((w) => w.toUpperCase() === s.symbol.toUpperCase())
    );

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    list.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'symbol':
          return sortDir === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case 'price':
          aVal = a.currentPrice || 0;
          bVal = b.currentPrice || 0;
          break;
        case 'change':
          aVal = a.changePercent || 0;
          bVal = b.changePercent || 0;
          break;
        case 'volume':
          aVal = a.volume || 0;
          bVal = b.volume || 0;
          break;
        default:
          return 0;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [stocks, watchlistSymbols, search, sortBy, sortDir]);

  const handleRemove = (e, symbol) => {
    e.stopPropagation();
    dispatch(removeFromWatchlist(symbol));
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // Calculate summary stats
  const totalGainers = watchlistStocks.filter((s) => (s.changePercent || 0) >= 0).length;
  const totalLosers = watchlistStocks.length - totalGainers;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiStar className="text-amber-500" size={22} />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Watchlists</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track your favorite stocks with real-time price updates
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary flex items-center gap-2 text-xs py-2.5 px-5"
        >
          <FiPlus size={14} />
          Add Stocks
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Watching</p>
          <p className="text-3xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-white">
            {watchlistStocks.length}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">stocks tracked</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Gainers</p>
          <p className="text-3xl font-extrabold font-mono tracking-tight text-green-600 dark:text-green-400">
            {totalGainers}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">stocks up today</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Losers</p>
          <p className="text-3xl font-extrabold font-mono tracking-tight text-red-500 dark:text-red-400">
            {totalLosers}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">stocks down today</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search watchlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 glass-input bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'Symbol', value: 'symbol' },
              { label: 'Price', value: 'price' },
              { label: '% Change', value: 'change' },
              { label: 'Volume', value: 'volume' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleSort(opt.value)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                  sortBy === opt.value
                    ? 'bg-[#0a0f1d] border-[#0a0f1d] text-white dark:bg-amber-500 dark:border-amber-500 dark:text-slate-900'
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
                {sortBy === opt.value && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Stock</th>
                <th className="py-4 px-5 text-right">Current Price</th>
                <th className="py-4 px-5 text-right">Change</th>
                <th className="py-4 px-5 text-right">% Change</th>
                <th className="py-4 px-5 text-right">Volume</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-350">
              {watchlistStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <FiEye className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold">Your watchlist is empty</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Add stocks from the Explore page to start tracking
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-4 btn-primary text-xs py-2 px-4"
                    >
                      Browse Stocks
                    </button>
                  </td>
                </tr>
              ) : (
                watchlistStocks.map((stock, idx) => {
                  const isPos = (stock.changePercent || 0) >= 0;
                  return (
                    <motion.tr
                      key={stock.symbol}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => navigate(`/trade/${stock.symbol}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                              isPos
                                ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}
                          >
                            {getStockIcon(stock.symbol)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 dark:text-white text-sm">
                              {stock.symbol}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[140px]">
                              {stock.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-800 dark:text-white text-sm">
                        ₹{Number(stock.currentPrice || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                          }`}
                        >
                          {isPos ? '+' : ''}
                          {Number(stock.change || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-sm ${
                            isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                          }`}
                        >
                          {isPos ? (
                            <FiTrendingUp size={12} />
                          ) : (
                            <FiTrendingDown size={12} />
                          )}
                          {isPos ? '+' : ''}
                          {Number(stock.changePercent || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {Number(stock.volume || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={(e) => handleRemove(e, stock.symbol)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-all"
                          title="Remove from watchlist"
                        >
                          <FiTrash2 size={14} />
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
