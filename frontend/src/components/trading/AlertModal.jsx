import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiBell, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AlertModal({ symbol, currentPrice, isOpen, onClose }) {
  const [criteria, setCriteria] = useState('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState(currentPrice ? currentPrice.toFixed(2) : '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(targetValue);
    if (isNaN(val) || val <= 0) {
      return toast.error('Please enter a valid target price');
    }

    setSubmitting(true);
    try {
      await api.post('/alerts', {
        symbol,
        criteriaType: criteria,
        value: val
      });
      toast.success(`Alert set: ${symbol} ${criteria === 'PRICE_ABOVE' ? 'above' : 'below'} ₹${val.toFixed(2)}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-md overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <FiBell size={20} />
            </div>
            <h3 className="font-bold text-lg">Create Price Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-sm">
            <span className="text-slate-500 dark:text-gray-400">
              Asset: <span className="font-bold text-slate-900 dark:text-white">{symbol}</span>
            </span>
            <span className="text-slate-500 dark:text-gray-400">
              Current Price:{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ₹{Number(currentPrice || 0).toFixed(2)}
              </span>
            </span>
          </div>

          {/* Trigger Condition */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-medium">
              Condition
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCriteria('PRICE_ABOVE')}
                className={`py-2 rounded-lg text-xs font-semibold uppercase transition-all ${
                  criteria === 'PRICE_ABOVE'
                    ? 'bg-gain text-white shadow-glow-green'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                Price Goes Above (≥)
              </button>
              <button
                type="button"
                onClick={() => setCriteria('PRICE_BELOW')}
                className={`py-2 rounded-lg text-xs font-semibold uppercase transition-all ${
                  criteria === 'PRICE_BELOW'
                    ? 'bg-loss text-white shadow-glow-red'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                Price Drops Below (≤)
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-medium">
              Target Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 glass-input font-bold font-mono text-slate-900 dark:text-white"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-ghost py-2.5 text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary py-2.5 text-sm"
              disabled={submitting}
            >
              {submitting ? 'Setting Alert...' : 'Set Alert'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
