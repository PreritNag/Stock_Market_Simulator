import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrendingUp, FiTrendingDown, FiMinus, FiPlus, FiAlertCircle, FiCheck, FiStar } from 'react-icons/fi';
import { fetchStockDetail, clearSelectedStock } from '../../store/marketSlice';
import { placeOrder, fetchWallet, fetchPortfolio } from '../../store/portfolioSlice';
import { addToWatchlist, removeFromWatchlist } from '../../store/authSlice';
import toast from 'react-hot-toast';

export default function StockDetailDrawer({ symbol, onClose }) {
  const dispatch = useDispatch();
  const { selectedStock, ohlcvData, loading } = useSelector((state) => state.market);
  const { orderLoading } = useSelector((state) => state.portfolio);
  const { balance } = useSelector((state) => state.wallet);
  const { user } = useSelector((state) => state.auth);

  const watchlistSymbols = user?.watchlist || [];
  const isWatched = useMemo(() => {
    return watchlistSymbols.some((s) => s.toUpperCase() === symbol?.toUpperCase());
  }, [watchlistSymbols, symbol]);

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

  const [timeframe, setTimeframe] = useState('1M');
  const [hoverData, setHoverData] = useState(null); // { price, date }
  const [tradeMode, setTradeMode] = useState(null); // null, 'BUY', 'SELL', 'SIP'
  const [quantity, setQuantity] = useState(1);
  const [orderMode, setOrderMode] = useState('MARKET'); // 'MARKET', 'LIMIT'
  const [limitPrice, setLimitPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const containerRef = useRef(null);
  const sparklineRef = useRef(null);

  // Close drawer on Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load stock details on mount
  useEffect(() => {
    if (symbol) {
      dispatch(fetchStockDetail(symbol));
      dispatch(fetchWallet());
      setTradeMode(null);
      setQuantity(1);
      setOrderMode('MARKET');
    }
    return () => {
      dispatch(clearSelectedStock());
    };
  }, [symbol, dispatch]);

  const stock = selectedStock || {};
  const price = Number(stock.currentPrice || 0);
  const isPositive = (stock.changePercent || 0) >= 0;

  // Set default limit price when tradeMode or stock price changes
  useEffect(() => {
    if (price) {
      setLimitPrice(price.toFixed(2));
    }
  }, [price, tradeMode]);

  // Slice OHLCV data based on timeframe
  const chartPoints = useMemo(() => {
    if (!ohlcvData || ohlcvData.length === 0) return [];
    
    let sliceLen = 30;
    if (timeframe === '1D') sliceLen = 15;
    else if (timeframe === '1W') sliceLen = 7;
    else if (timeframe === '1M') sliceLen = 30;
    else if (timeframe === '3M') sliceLen = 90;
    else if (timeframe === '6M') sliceLen = 180;
    else if (timeframe === '1Y') sliceLen = 365;

    return ohlcvData.slice(-sliceLen).map(pt => ({
      price: pt.close,
      date: new Date(pt.date || pt.time * 1000).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [ohlcvData, timeframe]);

  // Interactive SVG chart coordinates
  const svgHeight = 150;
  const svgWidth = 320;

  const sparklineData = useMemo(() => {
    if (chartPoints.length < 2) return null;
    const prices = chartPoints.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = chartPoints.map((pt, idx) => {
      const x = (idx / (chartPoints.length - 1)) * svgWidth;
      // Flip Y axis: min is bottom, max is top
      const y = svgHeight - 10 - ((pt.price - min) / range) * (svgHeight - 20);
      return { x, y, price: pt.price, date: pt.date };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

    return { points, linePath, areaPath };
  }, [chartPoints]);

  // Sparkline hover interaction
  const handleMouseMove = (e) => {
    if (!sparklineData || !sparklineRef.current) return;
    const rect = sparklineRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clientX / rect.width));
    const idx = Math.round(pct * (sparklineData.points.length - 1));
    const pt = sparklineData.points[idx];
    if (pt) {
      setHoverData({ price: pt.price, date: pt.date });
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Order submission
  const orderPrice = orderMode === 'MARKET' ? price : Number(limitPrice || 0);
  const total = orderPrice * quantity;
  const canAfford = tradeMode === 'BUY' ? total <= balance : true;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (quantity <= 0) return toast.error('Quantity must be greater than 0');
    if (orderMode === 'LIMIT' && (!limitPrice || Number(limitPrice) <= 0)) {
      return toast.error('Please enter a valid limit price');
    }
    if (!canAfford) return toast.error('Insufficient balance');

    try {
      await dispatch(placeOrder({
        symbol: stock.symbol,
        type: tradeMode === 'SIP' ? 'BUY' : tradeMode, // SIP translates to BUY in prototype
        qty: quantity,
        orderMode: orderMode,
        triggerPrice: orderMode === 'LIMIT' ? Number(limitPrice) : null,
      })).unwrap();

      setShowSuccess(true);
      toast.success(`${tradeMode} order placed successfully for ${quantity} shares!`);
      setQuantity(1);
      dispatch(fetchWallet());
      dispatch(fetchPortfolio());
      setTimeout(() => {
        setShowSuccess(false);
        setTradeMode(null);
      }, 1500);
    } catch (err) {
      toast.error(err || 'Order failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs"
      />

      {/* Drawer panel */}
      <motion.div
        ref={containerRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="w-full max-w-[420px] h-full bg-white dark:bg-slate-900 shadow-2xl relative flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <span className="text-[10px] tracking-wider text-slate-400 dark:text-slate-500 font-extrabold uppercase">
              {symbol}
            </span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
              {stock.name || 'Loading Stock...'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWatchlistToggle}
              className={`p-1.5 rounded-full transition-all ${
                isWatched
                  ? 'text-yellow-500 hover:bg-yellow-500/10'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
              title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <FiStar fill={isWatched ? 'currentColor' : 'none'} size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {loading && !selectedStock ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-800 border-t-amber-500 rounded-full animate-spin mb-2" />
            Loading details...
          </div>
        ) : (
          <div className="p-6 flex-1 flex flex-col gap-6">
            
            {/* Live Price Block */}
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter font-mono">
                  ₹{(hoverData ? hoverData.price : price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1.5 mt-1 text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                  <span>
                    1D {isPositive ? '+' : ''}{Number(stock.change || 0).toFixed(2)} ({isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%)
                  </span>
                </div>
              </div>
              {hoverData && (
                <div className="text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  {hoverData.date}
                </div>
              )}
            </div>

            {/* Quick Action Button Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTradeMode(tradeMode === 'BUY' ? null : 'BUY')}
                className={`py-2 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                  tradeMode === 'BUY' ? 'bg-emerald-700 ring-2 ring-emerald-500/30 shadow-md scale-95' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeMode(tradeMode === 'SELL' ? null : 'SELL')}
                className={`py-2 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                  tradeMode === 'SELL' ? 'bg-rose-700 ring-2 ring-rose-500/30 shadow-md scale-95' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Sell
              </button>
              <button
                onClick={() => setTradeMode(tradeMode === 'SIP' ? null : 'SIP')}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-colors ${
                  tradeMode === 'SIP'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                SIP
              </button>
            </div>

            {/* Inline Trade Action Panel */}
            <AnimatePresence>
              {tradeMode && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handlePlaceOrder}
                  className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase">
                      Place {tradeMode} Order
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderMode('MARKET')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                          orderMode === 'MARKET' ? 'bg-slate-950 text-white dark:bg-brand-gold dark:text-slate-900 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        Market
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderMode('LIMIT')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                          orderMode === 'LIMIT' ? 'bg-slate-950 text-white dark:bg-brand-gold dark:text-slate-900 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        Limit
                      </button>
                    </div>
                  </div>

                  {/* Limit Price Input */}
                  {orderMode === 'LIMIT' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Limit Price</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-brand-gold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quantity adjustment */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                      >
                        <FiMinus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-brand-gold"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Order Total & Balance */}
                  <div className="text-xs space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Total</span>
                      <span className={`font-mono font-bold ${tradeMode === 'SELL' ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Available Balance</span>
                      <span className={`font-mono font-bold ${!canAfford && tradeMode === 'BUY' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Insufficient Warning */}
                  {!canAfford && tradeMode === 'BUY' && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/25 border border-rose-100/80 dark:border-rose-900/40 p-2.5 rounded-xl">
                      <FiAlertCircle size={14} className="shrink-0" />
                      <span>Insufficient wallet balance.</span>
                    </div>
                  )}

                  {/* Submit Order */}
                  <AnimatePresence mode="wait">
                    {showSuccess ? (
                      <div className="w-full py-2.5 rounded-xl bg-slate-950 dark:bg-brand-gold text-white dark:text-slate-950 font-bold flex items-center justify-center gap-1.5 text-xs shadow-sm">
                        <FiCheck size={14} />
                        Order Executed!
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={orderLoading || (!canAfford && tradeMode === 'BUY')}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase text-white transition-all shadow-sm ${
                          tradeMode === 'SELL'
                            ? 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 disabled:opacity-50'
                            : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50'
                        }`}
                      >
                        {orderLoading ? 'Processing...' : `Confirm ${tradeMode}`}
                      </button>
                    )}
                  </AnimatePresence>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Interactive Sparkline Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Interactive Chart
                </span>
                {/* Timeframes */}
                <div className="flex gap-1">
                  {['1D', '1W', '1M', '3M', '6M', '1Y'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeframe(t)}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                        timeframe === t
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sparkline Canvas / SVG Area */}
              {sparklineData ? (
                <div
                  ref={sparklineRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="w-full border border-slate-200 dark:border-slate-800/60 rounded-2xl relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer pt-3"
                  style={{ height: `${svgHeight}px` }}
                >
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
                    <defs>
                      <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={sparklineData.areaPath}
                      fill="url(#sparklineGrad)"
                    />
                    <path
                      d={sparklineData.linePath}
                      fill="none"
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-full border border-slate-200 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 h-36 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                  Chart unavailable
                </div>
              )}
            </div>

            {/* Key Statistics Grid */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Key Stats
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">1D Low</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₹{(stock.low || price * 0.98).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">1D High</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ₹{(stock.high || price * 1.02).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">P/E Ratio</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {stock.peRatio !== null && stock.peRatio !== undefined ? Number(stock.peRatio).toFixed(1) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Mkt Cap</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {stock.marketCap ? (stock.marketCap > 1000000 ? 'Large Cap' : (stock.marketCap > 200000 ? 'Mid Cap' : 'Small Cap')) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Link to Full Interactive Chart */}
            <div className="pt-2">
              <Link
                to={`/trade/${symbol}`}
                onClick={onClose}
                className="w-full py-3 bg-slate-950 dark:bg-brand-gold text-white dark:text-slate-955 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-900 dark:hover:bg-amber-500 transition-colors shadow-md"
              >
                Go to Full Interactive Chart →
              </Link>
            </div>

          </div>
        )}
      </motion.div>
    </div>
  );
}
