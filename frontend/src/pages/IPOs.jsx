import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiTrendingUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getStockIcon } from '../utils/stockIcons';

// Mock IPO data for Indian market
const MOCK_IPOS = {
  open: [
    {
      id: 1,
      company: 'Hexaware Technologies Ltd',
      priceRange: '₹674 - ₹708',
      lotSize: 21,
      issueSize: '₹8,750 Cr',
      openDate: '2026-06-02',
      closeDate: '2026-06-05',
      listingDate: '2026-06-10',
      type: 'Book Built',
      subscription: '12.4x',
      category: 'Tech',
      gmp: '+₹85',
    },
    {
      id: 2,
      company: 'Niva Bupa Health Insurance',
      priceRange: '₹220 - ₹232',
      lotSize: 64,
      issueSize: '₹2,200 Cr',
      openDate: '2026-06-03',
      closeDate: '2026-06-06',
      listingDate: '2026-06-11',
      type: 'Book Built',
      subscription: '3.8x',
      category: 'Finance',
      gmp: '+₹18',
    },
  ],
  upcoming: [
    {
      id: 3,
      company: 'Ather Energy Ltd',
      priceRange: '₹304 - ₹321',
      lotSize: 46,
      issueSize: '₹3,100 Cr',
      openDate: '2026-06-12',
      closeDate: '2026-06-16',
      listingDate: '2026-06-19',
      type: 'Book Built',
      subscription: '—',
      category: 'EV / Auto',
      gmp: '+₹42',
    },
    {
      id: 4,
      company: 'Waaree Energies Ltd',
      priceRange: '₹1,427 - ₹1,503',
      lotSize: 9,
      issueSize: '₹4,321 Cr',
      openDate: '2026-06-18',
      closeDate: '2026-06-20',
      listingDate: '2026-06-25',
      type: 'Book Built',
      subscription: '—',
      category: 'Energy',
      gmp: '+₹210',
    },
    {
      id: 5,
      company: 'Swiggy Ltd',
      priceRange: '₹371 - ₹390',
      lotSize: 38,
      issueSize: '₹11,300 Cr',
      openDate: '2026-06-22',
      closeDate: '2026-06-26',
      listingDate: '2026-06-30',
      type: 'Book Built',
      subscription: '—',
      category: 'Tech / FoodTech',
      gmp: '+₹55',
    },
  ],
  listed: [
    {
      id: 6,
      company: 'Bajaj Housing Finance Ltd',
      priceRange: '₹66 - ₹70',
      lotSize: 214,
      issueSize: '₹6,560 Cr',
      openDate: '2026-05-09',
      closeDate: '2026-05-13',
      listingDate: '2026-05-18',
      type: 'Book Built',
      subscription: '67.4x',
      category: 'Finance',
      listingPrice: '₹150',
      listingGain: '+114.3%',
    },
    {
      id: 7,
      company: 'Hyundai Motor India Ltd',
      priceRange: '₹1,865 - ₹1,960',
      lotSize: 7,
      issueSize: '₹27,870 Cr',
      openDate: '2026-05-15',
      closeDate: '2026-05-17',
      listingDate: '2026-05-22',
      type: 'Book Built',
      subscription: '2.4x',
      category: 'Auto',
      listingPrice: '₹1,934',
      listingGain: '-1.3%',
    },
    {
      id: 8,
      company: 'Afcons Infrastructure Ltd',
      priceRange: '₹440 - ₹463',
      lotSize: 32,
      issueSize: '₹5,430 Cr',
      openDate: '2026-05-20',
      closeDate: '2026-05-22',
      listingDate: '2026-05-27',
      type: 'Book Built',
      subscription: '5.1x',
      category: 'Infra',
      listingPrice: '₹510',
      listingGain: '+10.2%',
    },
  ],
};

export default function IPOs() {
  const [activeTab, setActiveTab] = useState('open');

  const tabs = [
    { key: 'open', label: 'Open Now', icon: FiAlertCircle, count: MOCK_IPOS.open.length },
    { key: 'upcoming', label: 'Upcoming', icon: FiClock, count: MOCK_IPOS.upcoming.length },
    { key: 'listed', label: 'Recently Listed', icon: FiCheckCircle, count: MOCK_IPOS.listed.length },
  ];

  const currentIPOs = MOCK_IPOS[activeTab] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FiCalendar className="text-slate-700 dark:text-slate-400" size={22} />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">IPOs</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track upcoming, open, and recently listed Initial Public Offerings
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Open IPOs</p>
          <p className="text-3xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {MOCK_IPOS.open.length}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">apply before deadline</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Upcoming</p>
          <p className="text-3xl font-extrabold font-mono tracking-tight text-blue-600 dark:text-blue-400">
            {MOCK_IPOS.upcoming.length}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">opening soon</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Recently Listed</p>
          <p className="text-3xl font-extrabold font-mono tracking-tight text-green-600 dark:text-green-400">
            {MOCK_IPOS.listed.length}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">in last 30 days</p>
        </div>
      </div>

      {/* Tab Filters */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border ${
              activeTab === tab.key
                ? 'bg-[#0a0f1d] border-[#0a0f1d] text-white dark:bg-amber-500 dark:border-amber-500 dark:text-slate-900'
                : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span
              className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-900 text-slate-655 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* IPO Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {currentIPOs.map((ipo, idx) => (
          <motion.div
            key={ipo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {/* Top Row: Company & Status */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm text-slate-500">
                  {getStockIcon(ipo.company)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-850 dark:text-white text-sm leading-tight">
                    {ipo.company}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 px-2 py-0.5 rounded mt-1 inline-block">
                    {ipo.category}
                  </span>
                </div>
              </div>
              {activeTab === 'open' && (
                <span className="text-[10px] font-bold bg-green-50 text-green-750 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 px-2.5 py-1 rounded-lg animate-pulse">
                  OPEN
                </span>
              )}
              {activeTab === 'upcoming' && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-750 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 px-2.5 py-1 rounded-lg">
                  UPCOMING
                </span>
              )}
              {activeTab === 'listed' && (
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    ipo.listingGain?.startsWith('+')
                      ? 'bg-green-50 text-green-750 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                      : 'bg-red-50 text-red-655 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                  }`}
                >
                  {ipo.listingGain}
                </span>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-405 dark:text-slate-500 font-semibold block">Price Band</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ipo.priceRange}</span>
              </div>
              <div>
                <span className="text-slate-405 dark:text-slate-500 font-semibold block">Issue Size</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ipo.issueSize}</span>
              </div>
              <div>
                <span className="text-slate-405 dark:text-slate-500 font-semibold block">Lot Size</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ipo.lotSize} shares</span>
              </div>
              <div>
                <span className="text-slate-405 dark:text-slate-500 font-semibold block">
                  {activeTab === 'listed' ? 'Listing Price' : 'GMP'}
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {activeTab === 'listed' ? ipo.listingPrice : ipo.gmp}
                </span>
              </div>
              <div>
                <span className="text-slate-405 dark:text-slate-500 font-semibold block">Open Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(ipo.openDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-405 dark:text-slate-500 font-semibold block">Listing Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(ipo.listingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </div>

            {/* Subscription status for open IPOs */}
            {activeTab === 'open' && ipo.subscription !== '—' && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-405 dark:text-slate-500 font-semibold">Subscription</span>
                  <span className="font-extrabold text-green-600 dark:text-green-400">{ipo.subscription}</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                     className="h-full bg-gradient-to-r from-green-400 to-green-600 dark:from-green-500 dark:to-green-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(parseFloat(ipo.subscription) * 8, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {currentIPOs.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FiCalendar className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            No IPOs in this category right now
          </p>
        </div>
      )}
    </motion.div>
  );
}
