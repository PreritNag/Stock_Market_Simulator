import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiSearch, FiSliders, FiActivity } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Screener() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters state
  const [category, setCategory] = useState('ALL');
  const [sector, setSector] = useState('ALL');
  const [peFilter, setPeFilter] = useState('ALL'); // 'ALL', 'LOW' (<15), 'MED' (15-30), 'HIGH' (>30)
  const [sortBy, setSortBy] = useState('marketCap'); // 'marketCap', 'volume', 'peRatio', 'changePercent', 'currentPrice'

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const { data } = await api.get('/stocks');
        // If the backend returns standard stocks list, set it.
        // The /api/stocks endpoint is mapped to getAllStocks which returns { success, count, stocks }
        setAssets(data.stocks || []);
      } catch (err) {
        console.error('Failed to fetch assets for screener:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading asset screener..." />;
  }

  // Get unique list of sectors
  const sectors = ['ALL', ...new Set(assets.map(a => a.sector).filter(Boolean))];

  // Filter logic
  const filteredAssets = assets.filter(a => {
    const matchSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || 
                        a.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'ALL' || a.category === category;
    const matchSector = sector === 'ALL' || a.sector === sector;
    
    let matchPe = true;
    if (peFilter === 'LOW') matchPe = a.peRatio !== null && a.peRatio < 15;
    else if (peFilter === 'MED') matchPe = a.peRatio !== null && a.peRatio >= 15 && a.peRatio <= 30;
    else if (peFilter === 'HIGH') matchPe = a.peRatio !== null && a.peRatio > 30;

    return matchSearch && matchCategory && matchSector && matchPe;
  });

  // Sort logic
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let valA = a[sortBy] ?? 0;
    let valB = b[sortBy] ?? 0;

    // Handle null values for sorting so they appear last
    if (a[sortBy] === null) valA = -999999999;
    if (b[sortBy] === null) valB = -999999999;

    return valB - valA; // Descending sort
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiActivity className="text-slate-600 dark:text-slate-400" /> Asset Screener
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Filter and sort assets across Stocks, ETFs, Forex, and Crypto</p>
        </div>
      </div>

      {/* Filters Dashboard */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-755 dark:text-slate-300 font-bold pb-3 border-b border-slate-100 dark:border-slate-800">
          <FiSliders className="text-slate-500 dark:text-slate-400" /> Filters & Settings
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search symbol/name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm glass-input bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 py-2"
          >
            <option value="ALL">All Categories</option>
            <option value="STOCK">Stocks</option>
            <option value="ETF">ETFs</option>
            <option value="INDEX">Indices</option>
            <option value="FOREX">Forex</option>
            <option value="CRYPTO">Crypto</option>
          </select>

          {/* Sector */}
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="glass-input text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 py-2"
          >
            <option value="ALL">All Sectors</option>
            {sectors.filter(s => s !== 'ALL').map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          {/* PE Ratio */}
          <select
            value={peFilter}
            onChange={(e) => setPeFilter(e.target.value)}
            className="glass-input text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 py-2"
          >
            <option value="ALL">All PE Ratios</option>
            <option value="LOW">Low PE (Under 15)</option>
            <option value="MED">Average PE (15 - 30)</option>
            <option value="HIGH">High PE (Over 30)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input text-sm text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 py-2"
          >
            <option value="marketCap">Sort by Market Cap</option>
            <option value="volume">Sort by Volume</option>
            <option value="peRatio">Sort by PE Ratio</option>
            <option value="changePercent">Sort by 24h Change %</option>
            <option value="currentPrice">Sort by Price</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-5">Symbol / Name</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Price</th>
                <th className="py-4 px-5">24h Change</th>
                <th className="py-4 px-5">Market Cap</th>
                <th className="py-4 px-5">PE Ratio</th>
                <th className="py-4 px-5">Div Yield</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
              {sortedAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No assets matched your search filters.
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset) => {
                  const isPos = (asset.change ?? 0) >= 0;
                  return (
                    <tr key={asset.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-5">
                        <Link to={`/trade/${asset.symbol}`} className="font-extrabold text-slate-800 dark:text-white hover:text-blue-650 dark:hover:text-blue-400 transition-colors text-sm">
                          {asset.symbol}
                        </Link>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{asset.name}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400">
                          {asset.category}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-slate-800 dark:text-white text-sm">
                        ₹{Number(asset.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-sm">
                        <span className={`inline-flex items-center gap-1 ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                          {isPos ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                          {isPos ? '+' : ''}{Number(asset.changePercent || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-350">
                        {asset.marketCap 
                          ? `₹${(asset.marketCap / 1000).toFixed(1)}K Cr` 
                          : '—'}
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-350">
                        {asset.peRatio !== null && asset.peRatio !== undefined ? Number(asset.peRatio).toFixed(1) : '—'}
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-350">
                        {asset.dividendYield !== null && asset.dividendYield !== undefined ? `${Number(asset.dividendYield).toFixed(2)}%` : '—'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link to={`/trade/${asset.symbol}`} className="btn-primary py-1.5 px-4 text-[10px] font-bold">
                          Trade
                        </Link>
                      </td>
                    </tr>
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
