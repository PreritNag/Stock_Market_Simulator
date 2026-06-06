import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ITEMS_PER_PAGE = 10;

export default function TradeHistory({ trades = [], title = 'Trade History', showSymbol = true }) {
  const [sortField, setSortField] = useState('time');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'symbol': aVal = a.symbol; bVal = b.symbol; break;
        case 'type': aVal = a.type; bVal = b.type; break;
        case 'qty': aVal = Number(a.qty || a.quantity); bVal = Number(b.qty || b.quantity); break;
        case 'price': aVal = Number(a.price); bVal = Number(b.price); break;
        case 'total': aVal = Number(a.price) * Number(a.qty || a.quantity); bVal = Number(b.price) * Number(b.qty || b.quantity); break;
        case 'pnl': aVal = Number(a.pnl || 0); bVal = Number(b.pnl || 0); break;
        default: aVal = new Date(a.timestamp || a.createdAt || a.time || 0).getTime(); bVal = new Date(b.timestamp || b.createdAt || b.time || 0).getTime();
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [trades, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paged = sorted.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />;
  };

  const formatTime = (t) => {
    if (!t) return '—';
    const d = new Date(t);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">{trades.length} trades</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              {showSymbol && (
                <th onClick={() => toggleSort('symbol')} className="px-4 py-3 text-left cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                  <span className="flex items-center gap-1">Symbol <SortIcon field="symbol" /></span>
                </th>
              )}
              <th onClick={() => toggleSort('type')} className="px-4 py-3 text-left cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                <span className="flex items-center gap-1">Type <SortIcon field="type" /></span>
              </th>
              <th onClick={() => toggleSort('qty')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                <span className="flex items-center gap-1 justify-end">Qty <SortIcon field="qty" /></span>
              </th>
              <th onClick={() => toggleSort('price')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                <span className="flex items-center gap-1 justify-end">Price <SortIcon field="price" /></span>
              </th>
              <th onClick={() => toggleSort('total')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                <span className="flex items-center gap-1 justify-end">Total <SortIcon field="total" /></span>
              </th>
              <th onClick={() => toggleSort('pnl')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                <span className="flex items-center gap-1 justify-end">P&L <SortIcon field="pnl" /></span>
              </th>
              <th onClick={() => toggleSort('time')} className="px-4 py-3 text-right cursor-pointer hover:text-slate-700 dark:hover:text-white transition-colors">
                <span className="flex items-center gap-1 justify-end">Time <SortIcon field="time" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length > 0 ? paged.map((trade, idx) => {
              const qty = Number(trade.qty || trade.quantity || 0);
              const price = Number(trade.price || 0);
              const total = qty * price;
              const pnl = Number(trade.pnl || 0);
              const isBuy = trade.type === 'BUY';

              return (
                <motion.tr
                  key={trade._id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-b border-slate-100/50 dark:border-slate-800/60 transition-colors"
                >
                  {showSymbol && (
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{trade.symbol}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                      isBuy
                        ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {isBuy ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{qty}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">₹{price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 dark:text-white">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${trade.type === 'SELL' ? (pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-450') : 'text-slate-400 dark:text-slate-600'}`}>
                    {trade.type === 'SELL' ? `${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 dark:text-slate-500 text-xs font-mono">
                    {formatTime(trade.timestamp || trade.createdAt || trade.time)}
                  </td>
                </motion.tr>
              );
            }) : (
              <tr>
                <td colSpan={showSymbol ? 7 : 6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  No trades yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
