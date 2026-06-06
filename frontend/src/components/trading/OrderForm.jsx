import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMinus, FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { placeOrder } from '../../store/portfolioSlice';
import { fetchWallet, fetchPortfolio } from '../../store/portfolioSlice';
import { getStockIcon } from '../../utils/stockIcons';

export default function OrderForm({ stock }) {
  const dispatch = useDispatch();
  const { orderLoading } = useSelector((state) => state.portfolio);
  const { balance } = useSelector((state) => state.wallet);
  const [orderType, setOrderType] = useState('BUY');
  const [orderMode, setOrderMode] = useState('MARKET'); // 'MARKET', 'LIMIT', 'STOP'
  const [triggerPrice, setTriggerPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const price = Number(stock?.currentPrice || 0);

  useEffect(() => {
    if (orderMode !== 'MARKET' && !triggerPrice && price) {
      setTriggerPrice(price.toFixed(2));
    }
  }, [orderMode, price, triggerPrice]);

  const orderPrice = orderMode === 'MARKET' ? price : Number(triggerPrice || 0);
  const total = orderPrice * quantity;
  const canAfford = orderType === 'BUY' ? total <= balance : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) return toast.error('Quantity must be greater than 0');
    if (orderMode !== 'MARKET' && (!triggerPrice || Number(triggerPrice) <= 0)) {
      return toast.error('Please enter a valid trigger price');
    }
    if (!canAfford) return toast.error('Insufficient balance');

    try {
      await dispatch(placeOrder({
        symbol: stock.symbol,
        type: orderType,
        qty: quantity,
        orderMode: orderMode,
        triggerPrice: orderMode !== 'MARKET' ? Number(triggerPrice) : null,
      })).unwrap();

      setShowSuccess(true);
      toast.success(`${orderMode} ${orderType} order placed: ${quantity} × ${stock.symbol}`);
      setQuantity(1);
      dispatch(fetchWallet());
      dispatch(fetchPortfolio());

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      toast.error(err || 'Order failed');
    }
  };

  const adjustQty = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const quickAmounts = [1, 5, 10, 25, 50];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* BUY/SELL Toggle */}
      <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1 rounded-t-2xl">
        <button
          onClick={() => setOrderType('BUY')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            orderType === 'BUY'
              ? 'bg-gain text-white shadow-glow-green'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderType('SELL')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            orderType === 'SELL'
              ? 'bg-loss text-white shadow-glow-red'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Stock Info */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
              orderType === 'BUY' ? 'bg-gain/10 text-gain border border-gain/20' : 'bg-loss/10 text-loss border border-loss/20'
            }`}>
              {getStockIcon(stock?.symbol)}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{stock?.symbol || 'STOCK'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{stock?.name || 'Stock Name'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-slate-800 dark:text-white">₹{price.toFixed(2)}</p>
            <p className={`text-xs font-bold ${(stock?.change || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {(stock?.change || 0) >= 0 ? '+' : ''}{Number(stock?.changePercent || 0).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Order Mode (Market, Limit, Stop) */}
        <div>
          <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-extrabold">Order Type</label>
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800/60">
            {['MARKET', 'LIMIT', 'STOP'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setOrderMode(m)}
                className={`py-1.5 rounded-lg text-xs font-semibold uppercase transition-all duration-200 ${
                  orderMode === m
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                    : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {m.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Price for Limit & Stop */}
        {orderMode !== 'MARKET' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold">
              {orderMode === 'LIMIT' ? 'Limit Price' : 'Stop Price'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 glass-input font-bold font-mono"
              />
            </div>
          </motion.div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-extrabold">Quantity</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustQty(-1)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <FiMinus size={16} />
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center text-lg font-bold font-mono py-2.5 glass-input"
            />
            <button
              type="button"
              onClick={() => adjustQty(1)}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/40 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <FiPlus size={16} />
            </button>
          </div>

          {/* Quick amounts */}
          <div className="flex items-center gap-2 mt-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuantity(amt)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  quantity === amt
                    ? orderType === 'BUY' ? 'bg-gain/20 text-gain border border-gain/30' : 'bg-loss/20 text-loss border border-loss/30'
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Price per share</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Quantity</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">×{quantity}</span>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <div className="flex items-center justify-between">
            <span className="text-slate-700 dark:text-slate-300 font-bold">Total</span>
            <span className={`text-lg font-bold font-mono ${orderType === 'BUY' ? 'text-gain' : 'text-loss'}`}>
              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between text-sm px-1">
          <span className="text-slate-500 dark:text-slate-400">Available Balance</span>
          <span className={`font-mono font-bold ${!canAfford && orderType === 'BUY' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Insufficient balance warning */}
        {!canAfford && orderType === 'BUY' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/30 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold"
          >
            <FiAlertCircle size={14} className="flex-shrink-0" />
            <span>Insufficient balance. Top up your wallet.</span>
          </motion.div>
        )}

        {/* Submit */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold ${
                orderType === 'BUY' ? 'bg-gain text-white' : 'bg-loss text-white'
              }`}
            >
              <FiCheck size={20} />
              Order Placed!
            </motion.div>
          ) : (
            <motion.button
              key="submit"
              type="submit"
              disabled={orderLoading || (!canAfford && orderType === 'BUY')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                orderType === 'BUY'
                  ? 'bg-gradient-to-r from-gain to-gain-dark text-white hover:shadow-glow-green'
                  : 'bg-gradient-to-r from-loss to-loss-dark text-white hover:shadow-glow-red'
              }`}
            >
              {orderLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                `${orderType} ${stock?.symbol || 'STOCK'}`
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
