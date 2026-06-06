import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiDollarSign, FiArrowUpRight, FiArrowDownRight, FiShield } from 'react-icons/fi';
import StripeButton from './StripeButton';
import formatCurrency from '../../utils/formatCurrency';

export default function WalletCard({ onTopUpSuccess }) {
  const { balance } = useSelector((state) => state.wallet);
  const { totalPnL } = useSelector((state) => state.portfolio);
  const isPnLPositive = totalPnL >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="relative p-8 bg-gradient-to-br from-primary-500/15 via-accent-purple/10 to-transparent dark:from-primary-500/10 dark:via-accent-purple/5 dark:to-transparent">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-accent-purple/10 dark:bg-accent-purple/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                <FiDollarSign size={14} />
                Virtual Balance
              </p>
              <p className="text-5xl font-bold font-mono tracking-tight text-slate-800 dark:text-white">
                {formatCurrency(balance)}
              </p>
              <div className={`flex items-center gap-2 mt-3 ${isPnLPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {isPnLPositive ? <FiArrowUpRight size={18} /> : <FiArrowDownRight size={18} />}
                <span className="text-sm font-semibold">
                  {isPnLPositive ? '+' : ''}{formatCurrency(totalPnL)} all time P&L
                </span>
              </div>
            </div>

            <StripeButton />
          </div>
        </div>
      </div>

      <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <FiShield className="text-primary-500 dark:text-primary-400 shrink-0" size={16} />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Pay ₹1 via Stripe to receive ₹5,000 virtual balance. Your real money is used only for verification.
        </p>
      </div>
    </motion.div>
  );
}
