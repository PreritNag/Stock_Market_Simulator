import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLogOut, FiBell, FiChevronDown, FiExternalLink, FiSearch, FiSun, FiMoon } from 'react-icons/fi';
import { logout } from '../../store/authSlice';
import { setActivePrimaryTab } from '../../store/marketSlice';
import { useTheme } from '../../context/ThemeContext';
import StockSearch from '../trading/StockSearch';
import Logo from '../common/Logo';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { activePrimaryTab } = useSelector((state) => state.market);
  const { theme, toggleTheme, isDark } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handlePrimaryTabClick = (tab) => {
    dispatch(setActivePrimaryTab(tab));
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  // Determine active sub-tab based on pathname
  const getActiveSubTab = () => {
    const path = location.pathname;
    if (path === '/') return 'Explore';
    if (path.startsWith('/portfolio')) return 'My Stocks';
    if (path.startsWith('/positions')) return 'Positions';
    if (path.startsWith('/orders')) return 'Orders';
    if (path.startsWith('/wallet')) return 'Wallet';
    if (path.startsWith('/screener')) return 'Screeners';
    if (path.startsWith('/watchlists')) return 'Watchlists';
    if (path.startsWith('/ipos')) return 'IPOs';
    if (path.startsWith('/pnl-calendar')) return 'P&L Calendar';
    if (path.startsWith('/settings')) return 'Settings';
    return '';
  };

  const activeSubTab = getActiveSubTab();

  const primaryTabs = [
    { name: 'Dashboard', isExternal: false },
    { name: 'US Stocks', isExternal: false },
    { name: 'Mutual Funds', isExternal: false },
    { name: 'BullForge', isExternal: false },
    { name: 'F&O', isExternal: false },
    { name: 'Flash Trading', isExternal: true },
    { name: 'Algo Trading', isExternal: true }
  ];

  const subTabs = [
    { name: 'Explore', path: '/' },
    { name: 'My Stocks', path: '/portfolio' },
    { name: 'Positions', path: '/positions' },
    { name: 'Orders', path: '/orders' },
    { name: 'Wallet', path: '/wallet' },
    { name: 'Screeners', path: '/screener' },
    { name: 'Watchlists', path: '/watchlists' },
    { name: 'IPOs', path: '/ipos' },
    { name: 'P&L Calendar', path: '/pnl-calendar' }
  ];

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Level 1: Brand & Primary Navigation — Midnight Indigo */}
      <div className="bg-[#0a0f1d]">
        <div className="max-w-[1440px] mx-auto h-14 px-4 lg:px-6 flex items-center justify-between">
          
          {/* Left: Brand Logo & Primary Tabs */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link to="/">
              <Logo size="md" variant="navbar" />
            </Link>

            {/* Primary Tabs */}
            <nav className="hidden lg:flex items-center gap-5">
              {primaryTabs.map((tab) => {
                const isActive = activePrimaryTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => !tab.isExternal && handlePrimaryTabClick(tab.name)}
                    className={`flex items-center gap-1 text-xs font-semibold tracking-wide transition-colors ${
                      isActive
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{tab.name}</span>
                    {tab.isExternal && <FiExternalLink size={10} className="text-slate-500" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Notification & User Profile */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
            {/* Search bar inside level 1 */}
            <div className="w-full max-w-[240px] md:max-w-[320px]">
              <StockSearch />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors relative">
              <FiBell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            </button>

            {/* User profile dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#0a0f1d] flex items-center justify-center font-extrabold text-xs hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/portfolio" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                        Portfolio
                      </Link>
                      <Link to="/wallet" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                        Wallet
                      </Link>
                      <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Level 2: Sub-navigation Tabs — Pure White */}
      <div className="border-b border-slate-100 bg-white shadow-sm">
        <div className="max-w-[1440px] mx-auto h-11 px-4 lg:px-6 flex items-center justify-between overflow-x-auto">
          {/* Scrollable sub-tabs */}
          <nav className="flex items-center gap-6 h-full overflow-x-auto scrollbar-none whitespace-nowrap">
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.name;
              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={`h-full flex items-center text-xs font-semibold border-b-2 tracking-wide transition-all ${
                    isActive
                      ? 'border-[#0a0f1d] text-[#0a0f1d] font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>

          {/* Feedback link */}
          <a
            href="#feedback"
            className="text-xs font-semibold text-slate-500 hover:text-[#0a0f1d] whitespace-nowrap ml-4 underline decoration-slate-300 transition-colors"
          >
            Share Feedback
          </a>
        </div>
      </div>
    </header>
  );
}
