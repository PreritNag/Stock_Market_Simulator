import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiTrendingUp, FiBriefcase, FiCreditCard, FiX, FiActivity, FiList, FiSliders, FiMessageCircle } from 'react-icons/fi';
import StockCard from '../common/StockCard';

const navItems = [
  { path: '/', icon: FiGrid, label: 'Dashboard' },
  { path: '/markets', icon: FiActivity, label: 'Markets' },
  { path: '/screener', icon: FiSliders, label: 'Screener' },
  { path: '/trade/RELIANCE', icon: FiTrendingUp, label: 'Trade' },
  { path: '/portfolio', icon: FiBriefcase, label: 'Portfolio' },
  { path: '/orders', icon: FiList, label: 'Orders' },
  { path: '/community', icon: FiMessageCircle, label: 'Community' },
  { path: '/wallet', icon: FiCreditCard, label: 'Wallet' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { stocks } = useSelector((state) => state.market);
  const { user } = useSelector((state) => state.auth);

  const watchlistSymbols = user?.watchlist || [];
  const watchlistStocks = stocks.filter(stock => watchlistSymbols.includes(stock.symbol)).slice(0, 6);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-16 left-0 z-40 lg:z-30
        w-64 h-screen lg:h-[calc(100vh-4rem)]
        bg-surface-400/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
        border-r border-white/5
        overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-white/5">
            <span className="text-lg font-bold text-white">Menu</span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400">
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'));
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={isActive ? 'nav-link-active' : 'nav-link'}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 w-1 h-6 rounded-r-full bg-primary-500"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Watchlist */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Watchlist</h3>
              <span className="text-xs text-gray-500">{watchlistStocks.length} stocks</span>
            </div>
            <div className="space-y-0.5">
              {watchlistStocks.map((stock, index) => (
                <StockCard key={stock.symbol} stock={stock} index={index} compact />
              ))}
              {watchlistStocks.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  No stocks in watchlist
                </p>
              )}
            </div>
          </div>

          {/* Connection status */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-gain animate-pulse" />
              <span className="text-xs text-gray-400">Market Open</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
