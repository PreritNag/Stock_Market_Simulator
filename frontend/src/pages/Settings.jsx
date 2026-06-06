import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSettings, FiUser, FiBell, FiShield, FiMoon, FiLogOut,
  FiMail, FiCalendar, FiCreditCard, FiToggleLeft, FiToggleRight,
  FiChevronRight, FiInfo, FiSun
} from 'react-icons/fi';
import { logout } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import { fetchWallet } from '../store/walletSlice';
import { useEffect } from 'react';

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { balance } = useSelector((state) => state.wallet);
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    dispatch(fetchWallet());
  }, [dispatch]);

  // Notification preferences (local state, no backend)
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketNews, setMarketNews] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-[#0a0f1d]' : 'bg-slate-200'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FiSettings className="text-slate-700" size={22} />
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        </div>
        <p className="text-sm text-slate-500">
          Manage your account, preferences, and notifications
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FiUser className="text-slate-500" size={16} />
          <h2 className="text-sm font-bold text-slate-800">Profile</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0f1d] font-extrabold text-2xl shadow-lg shadow-amber-500/20">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">{user?.name || 'User'}</h3>
              <p className="text-sm text-slate-500">BullCash Trader</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FiMail className="text-slate-400" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-slate-700">{user?.email || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FiCalendar className="text-slate-400" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-semibold text-slate-700">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FiCreditCard className="text-slate-400" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Virtual Balance</p>
                <p className="text-sm font-bold text-green-600">
                  ₹{Number(balance).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FiShield className="text-slate-400" size={16} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
                <p className="text-sm font-bold text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FiBell className="text-slate-500" size={16} />
          <h2 className="text-sm font-bold text-slate-800">Notifications</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              label: 'Price Alerts',
              desc: 'Get notified when a stock reaches your target price',
              enabled: priceAlerts,
              onChange: setPriceAlerts,
            },
            {
              label: 'Order Updates',
              desc: 'Notifications when orders are executed or cancelled',
              enabled: orderUpdates,
              onChange: setOrderUpdates,
            },
            {
              label: 'Market News',
              desc: 'Breaking news and market-moving events',
              enabled: marketNews,
              onChange: setMarketNews,
            },
            {
              label: 'Weekly Report',
              desc: 'Weekly portfolio performance summary email',
              enabled: weeklyReport,
              onChange: setWeeklyReport,
            },
          ].map((pref) => (
            <div
              key={pref.label}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{pref.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{pref.desc}</p>
              </div>
              <ToggleSwitch enabled={pref.enabled} onChange={pref.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          {isDark ? <FiMoon className="text-slate-500" size={16} /> : <FiSun className="text-slate-500" size={16} />}
          <h2 className="text-sm font-bold text-slate-800">Appearance</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Dark Mode</p>
            <p className="text-xs text-slate-400 mt-0.5">Toggle between light and dark themes</p>
          </div>
          <ToggleSwitch enabled={isDark} onChange={toggleTheme} />
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FiSettings className="text-slate-500" size={16} />
          <h2 className="text-sm font-bold text-slate-800">Trading Preferences</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-800">Default Order Type</p>
              <p className="text-xs text-slate-400 mt-0.5">Used when placing quick orders</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              Market Order
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-800">Chart Timeframe</p>
              <p className="text-xs text-slate-400 mt-0.5">Default chart interval</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              1 Day
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-800">Currency Display</p>
              <p className="text-xs text-slate-400 mt-0.5">Primary currency for display</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              ₹ INR
            </span>
          </div>
        </div>
      </div>

      {/* About & App Info */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FiInfo className="text-slate-500" size={16} />
          <h2 className="text-sm font-bold text-slate-800">About</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">App Version</span>
            <span className="text-xs font-mono font-bold text-slate-400">v1.0.0</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">Platform</span>
            <span className="text-xs font-bold text-slate-400">BullCash Web</span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">License</span>
            <span className="text-xs font-bold text-slate-400">Educational / Simulator</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card overflow-hidden border-red-100">
        <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
          <FiShield className="text-red-400" size={16} />
          <h2 className="text-sm font-bold text-red-600">Danger Zone</h2>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold text-sm hover:bg-red-100 transition-all"
          >
            <FiLogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
}
