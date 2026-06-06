import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiSearch, FiFilter, FiActivity } from 'react-icons/fi';
import { fetchStocks } from '../store/marketSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getStockIcon } from '../utils/stockIcons';

export default function Markets() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stocks, loading } = useSelector((state) => state.market);

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  if (loading && stocks.length === 0) {
    return <LoadingSpinner size="lg" text="Loading market screeners..." />;
  }

  // Get unique list of sectors
  const sectors = ['ALL', ...new Set(stocks.map((s) => s.sector).filter(Boolean))];

  // Filter stocks based on search input and sector selection
  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
      stock.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <FiActivity className="text-primary-400" size={22} />
        <h1 className="text-2xl font-bold text-white">Market Screener</h1>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search stock name or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
          />
        </div>

        {/* Sector Selector */}
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" size={16} />
          <div className="flex flex-wrap gap-1 bg-surface-200/50 p-1 rounded-xl border border-white/5">
            {sectors.map((sector) => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  selectedSector === sector
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Sector</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Change (24h)</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredStocks.map((stock) => {
                const isPositive = (stock.change || 0) >= 0;
                return (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => navigate(`/trade/${stock.symbol}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          isPositive ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'
                        }`}>
                          {getStockIcon(stock.symbol)}
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{stock.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap font-medium">{stock.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-md border border-white/5">
                        {stock.sector}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-white text-right whitespace-nowrap">
                      ₹{Number(stock.currentPrice || 0).toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-right whitespace-nowrap font-semibold ${
                      isPositive ? 'text-gain' : 'text-loss'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                        <span>{isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/trade/${stock.symbol}`)}
                        className="px-3.5 py-1.5 text-xs font-bold btn-primary"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No stocks match the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
