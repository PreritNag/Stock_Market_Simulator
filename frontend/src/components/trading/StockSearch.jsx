import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import { searchStocks, clearSearchResults } from '../../store/marketSlice';
import { getStockIcon } from '../../utils/stockIcons';

export default function StockSearch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchResults, searchLoading } = useSelector((state) => state.market);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Debounced search logic
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        dispatch(searchStocks(searchQuery.trim()));
        setShowSearch(true);
      }, 300);
    } else {
      dispatch(clearSearchResults());
      setShowSearch(false);
    }
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery, dispatch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSelect = (symbol) => {
    navigate(`/trade/${symbol}`);
    setSearchQuery('');
    setShowSearch(false);
    dispatch(clearSearchResults());
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md mx-4 lg:mx-8">
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search stocks... (e.g., RELIANCE, TCS)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSearch && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute top-full mt-2 w-full glass-card border border-white/10 py-2 max-h-72 overflow-y-auto z-50"
          >
            {searchResults.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSearchSelect(stock.symbol)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-sm text-primary-400">
                  {getStockIcon(stock.symbol)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                  <p className="text-xs text-gray-400 truncate">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium">₹{Number(stock.currentPrice || 0).toFixed(2)}</p>
                  <p className={`text-xs ${(stock.change || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {(stock.change || 0) >= 0 ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
