import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { fetchTradeHistory } from '../store/portfolioSlice';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PnLCalendar() {
  const dispatch = useDispatch();
  const { tradeHistory } = useSelector((state) => state.portfolio);

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    dispatch(fetchTradeHistory());
  }, [dispatch]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Compute daily P&L from trade history
  const dailyPnL = useMemo(() => {
    const pnlMap = {};

    (tradeHistory || []).forEach((trade) => {
      const date = new Date(trade.executedAt || trade.createdAt || trade.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const pnl = Number(trade.pnl || 0);
      const amount = Number(trade.total || trade.price * trade.quantity || 0);

      // For buy orders, it's a cost (-), for sell it's revenue (+)
      let dayPnl = 0;
      if (trade.type === 'SELL') {
        dayPnl = pnl || amount * 0.02; // If no explicit P&L, estimate 2% gain
      } else if (trade.type === 'BUY') {
        dayPnl = -(pnl || 0); // Buys reduce P&L for the day
      }

      if (!pnlMap[key]) pnlMap[key] = 0;
      pnlMap[key] += dayPnl;
    });

    return pnlMap;
  }, [tradeHistory]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, pnl: null });
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const pnl = dailyPnL[key] || null;
      const isToday =
        d === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();
      days.push({ day: d, pnl, key, isToday });
    }

    return days;
  }, [year, month, dailyPnL]);

  // Month summary
  const monthSummary = useMemo(() => {
    let totalProfit = 0;
    let totalLoss = 0;
    let profitDays = 0;
    let lossDays = 0;

    calendarDays.forEach(({ pnl }) => {
      if (pnl && pnl > 0) {
        totalProfit += pnl;
        profitDays++;
      } else if (pnl && pnl < 0) {
        totalLoss += Math.abs(pnl);
        lossDays++;
      }
    });

    return { totalProfit, totalLoss, profitDays, lossDays, net: totalProfit - totalLoss };
  }, [calendarDays]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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
            <FiCalendar className="text-slate-700 dark:text-slate-400" size={22} />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">P&L Calendar</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualize your daily profit and loss performance
          </p>
        </div>
        <button
          onClick={goToToday}
          className="btn-ghost text-xs py-2 px-4"
        >
          Today
        </button>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`glass-card p-5 bg-gradient-to-br ${monthSummary.net >= 0 ? 'from-green-50/50 dark:from-green-950/20' : 'from-red-50/50 dark:from-red-950/20'} to-transparent`}>
          <p className="stat-label mb-2 dark:text-slate-400">Net P&L</p>
          <p className={`text-2xl font-extrabold font-mono tracking-tight ${monthSummary.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {monthSummary.net >= 0 ? '+' : '-'}₹{Math.abs(monthSummary.net).toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Total Profit</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-green-600 dark:text-green-400">
            +₹{monthSummary.totalProfit.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{monthSummary.profitDays} profitable days</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Total Loss</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-red-500 dark:text-red-400">
            -₹{monthSummary.totalLoss.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{monthSummary.lossDays} loss days</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
          <p className="stat-label mb-2 dark:text-slate-400">Win Rate</p>
          <p className="text-2xl font-extrabold font-mono tracking-tight text-blue-600 dark:text-blue-400">
            {monthSummary.profitDays + monthSummary.lossDays > 0
              ? ((monthSummary.profitDays / (monthSummary.profitDays + monthSummary.lossDays)) * 100).toFixed(0)
              : 0}%
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{monthSummary.profitDays + monthSummary.lossDays} trading days</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card overflow-hidden">
        {/* Month navigation */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <FiChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, idx) => (
            <div
              key={idx}
              className={`min-h-[80px] p-2 border-b border-r border-slate-100/60 dark:border-slate-850/60 transition-colors ${
                cell.day
                  ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-default'
                  : 'bg-slate-50/30 dark:bg-slate-900/10'
              } ${cell.isToday ? 'bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800 ring-inset' : ''}`}
            >
              {cell.day && (
                <>
                  <span
                    className={`text-xs font-bold ${
                      cell.isToday
                        ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40 w-6 h-6 rounded-full flex items-center justify-center'
                        : 'text-slate-600 dark:text-slate-350'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {cell.pnl !== null && (
                    <div className="mt-1.5">
                      <div
                        className={`text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded ${
                          cell.pnl >= 0
                            ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-red-50 text-red-750 dark:bg-red-500/10 dark:text-red-400'
                        }`}
                      >
                        {cell.pnl >= 0 ? '+' : ''}₹{Math.abs(cell.pnl).toFixed(0)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" />
            <span>Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" />
            <span>Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
