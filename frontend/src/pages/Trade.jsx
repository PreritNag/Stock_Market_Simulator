import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiStar, FiBell, FiPlus, FiSearch } from 'react-icons/fi';
import { addToWatchlist, removeFromWatchlist } from '../store/authSlice';
import StockChart from '../components/charts/StockChart';
import OrderForm from '../components/trading/OrderForm';
import OrderBook from '../components/trading/OrderBook';
import TradeHistory from '../components/trading/TradeHistory';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertModal from '../components/trading/AlertModal';
import { fetchStockDetail, clearSelectedStock } from '../store/marketSlice';
import { fetchOrders, fetchPortfolio, fetchWallet } from '../store/portfolioSlice';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

export default function Trade() {
  const { symbol } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedStock, ohlcvData, stocks, loading } = useSelector((state) => state.market);
  const { orders } = useSelector((state) => state.portfolio);
  const { user } = useSelector((state) => state.auth);
  const { subscribe, unsubscribe } = useSocket();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [watchlistSearch, setWatchlistSearch] = useState('');

  const watchlistSymbols = user?.watchlist || [];
  const isWatched = watchlistSymbols.some((s) => s.toUpperCase() === symbol?.toUpperCase());

  // Watchlist stock objects
  const watchlistStocks = useMemo(() => {
    const list = stocks.filter((s) => 
      watchlistSymbols.some((w) => w.toUpperCase() === s.symbol.toUpperCase())
    );
    if (!watchlistSearch.trim()) return list;
    return list.filter((s) =>
      s.symbol.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(watchlistSearch.toLowerCase())
    );
  }, [stocks, watchlistSymbols, watchlistSearch]);

  const handleWatchlistToggle = async () => {
    if (!symbol) return;
    const upperSymbol = symbol.toUpperCase();
    try {
      if (isWatched) {
        await dispatch(removeFromWatchlist(upperSymbol)).unwrap();
        toast.success(`${upperSymbol} removed from watchlist`);
      } else {
        await dispatch(addToWatchlist(upperSymbol)).unwrap();
        toast.success(`${upperSymbol} added to watchlist`);
      }
    } catch (err) {
      toast.error(err || 'Failed to update watchlist');
    }
  };

  useEffect(() => {
    if (symbol) {
      dispatch(fetchStockDetail(symbol));
      dispatch(fetchOrders());
      dispatch(fetchPortfolio());
      dispatch(fetchWallet());
      subscribe(symbol);
    }

    return () => {
      if (symbol) unsubscribe(symbol);
      dispatch(clearSelectedStock());
    };
  }, [symbol, dispatch, subscribe, unsubscribe]);

  if (loading && !selectedStock) {
    return <LoadingSpinner size="lg" text={`Loading chart terminal for ${symbol}...`} />;
  }

  const stock = selectedStock || {};
  const isPositive = (stock.change || 0) >= 0;
  const symbolOrders = orders.filter((o) => o.symbol === symbol);

  // Calculate day's range percentage position
  const low = stock.low || stock.currentPrice * 0.98 || 0;
  const high = stock.high || stock.currentPrice * 1.02 || 0;
  const current = stock.currentPrice || 0;
  const rangePct = high - low > 0 ? ((current - low) / (high - low)) * 100 : 50;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 max-w-[1440px] mx-auto"
    >
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">BullCash / Explore / {symbol}</span>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded font-extrabold">
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleWatchlistToggle}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isWatched
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <FiStar fill={isWatched ? 'currentColor' : 'none'} size={14} />
            <span>{isWatched ? 'Watching' : 'Watch'}</span>
          </button>
          <button
            onClick={() => setIsAlertOpen(true)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <FiBell size={14} />
            <span>Set Alert</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        
        {/* Left Column: Full Candlestick Technical Chart */}
        <div className="lg:col-span-3 space-y-4">
          <StockChart
            ohlcvData={ohlcvData}
            symbol={symbol}
            currentPrice={stock.currentPrice}
            change={stock.change}
            changePercent={stock.changePercent}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OrderBook symbol={symbol} />
            <TradeHistory
              trades={symbolOrders}
              title={`${symbol} Orders`}
              showSymbol={false}
            />
          </div>
        </div>

        {/* Right Column: Watchlist, Mini Order Form & Statistics */}
        <div className="space-y-4">
          
          {/* Watchlist Section */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Watchlist ({watchlistStocks.length})
              </h3>
              <button
                onClick={() => navigate('/')}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Add Stock
              </button>
            </div>

            {/* Search filter inside watchlist */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={12} />
              <input
                type="text"
                placeholder="Filter watchlist..."
                value={watchlistSearch}
                onChange={(e) => setWatchlistSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-brand-gold"
              />
            </div>

            <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {watchlistStocks.map((wStock) => {
                const wPos = wStock.changePercent >= 0;
                return (
                  <div
                    key={wStock.symbol}
                    onClick={() => navigate(`/trade/${wStock.symbol}`)}
                    className={`flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 transition-all ${
                      wStock.symbol === symbol ? 'bg-slate-50 dark:bg-slate-800/60 border-l-2 border-blue-600 dark:border-blue-400 pl-2' : ''
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">{wStock.symbol}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate max-w-[100px]">{wStock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                        ₹{Number(wStock.currentPrice).toFixed(2)}
                      </span>
                      <span className={`block text-[9px] font-semibold ${wPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {wPos ? '+' : ''}{Number(wStock.changePercent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {watchlistStocks.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                  Watchlist is empty
                </div>
              )}
            </div>
          </div>

          {/* Day's Statistics Card */}
          <div className="glass-card p-4 space-y-3">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{symbol} - {stock.market || 'NSE'}</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tighter">
                  ₹{Number(stock.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPositive ? '▲' : '▼'}{Math.abs(stock.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Slider day range */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                <span>Day's Range</span>
                <span className="text-slate-600 dark:text-slate-400">Slider</span>
              </div>
              <div className="relative pt-1.5">
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full w-full relative">
                  <div
                    className="absolute h-1 bg-slate-900 dark:bg-brand-gold rounded-full"
                    style={{ left: '0%', width: `${rangePct}%` }}
                  />
                  <div
                    className="absolute w-2.5 h-2.5 bg-slate-900 dark:bg-brand-gold rounded-full -top-0.5 border border-white dark:border-slate-900"
                    style={{ left: `calc(${rangePct}% - 5px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  <span>₹{low.toFixed(2)}</span>
                  <span>₹{high.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <div>
                <span>Open: </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{Number(stock.open || stock.currentPrice * 0.995).toFixed(2)}</span>
              </div>
              <div>
                <span>Volume: </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{Number(stock.volume || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Order Placing Box */}
          <OrderForm stock={stock} />

        </div>

      </div>

      <AlertModal
        symbol={symbol}
        currentPrice={stock.currentPrice}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />
    </motion.div>
  );
}
