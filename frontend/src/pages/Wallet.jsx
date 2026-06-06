import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiDollarSign, FiArrowUpRight, FiArrowDownRight, FiCheck, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { fetchWallet, fetchTransactions, verifyPayment } from '../store/walletSlice';
import WalletCard from '../components/wallet/WalletCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import formatCurrency from '../utils/formatCurrency';
import formatDate from '../utils/formatDate';

export default function Wallet() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { balance, transactions, loading } = useSelector((state) => state.wallet);
  const { totalPnL } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchTransactions());
  }, [dispatch]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const paymentStatus = query.get('payment');
    const sessionId = query.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      const verify = async () => {
        const toastId = toast.loading('Verifying your payment...');
        try {
          const result = await dispatch(verifyPayment(sessionId)).unwrap();
          toast.dismiss(toastId);
          toast.success(result.message || 'Balance topped up successfully!');
          dispatch(fetchWallet());
          dispatch(fetchTransactions());
          navigate('/wallet', { replace: true });
        } catch (err) {
          toast.dismiss(toastId);
          toast.error(err || 'Verification failed');
          navigate('/wallet', { replace: true });
        }
      };
      verify();
    } else if (paymentStatus === 'cancel') {
      toast.error('Payment cancelled');
      navigate('/wallet', { replace: true });
    }
  }, [location, dispatch, navigate]);

  const isPnLPositive = totalPnL >= 0;

  const handleTopUpSuccess = () => {
    dispatch(fetchWallet());
    dispatch(fetchTransactions());
  };

  if (loading && transactions.length === 0) {
    return <LoadingSpinner size="lg" text="Loading wallet history..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <FiCreditCard className="text-slate-700 dark:text-slate-400" size={20} />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Wallet</h1>
      </div>

      {/* Balance Card */}
      <WalletCard onTopUpSuccess={handleTopUpSuccess} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Available Balance',
            value: formatCurrency(balance),
            icon: FiDollarSign,
            color: 'text-green-600 dark:text-green-400',
            bg: 'from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent',
          },
          {
            label: 'Total P&L',
            value: `${isPnLPositive ? '+' : ''}${formatCurrency(totalPnL)}`,
            icon: isPnLPositive ? FiArrowUpRight : FiArrowDownRight,
            color: isPnLPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
            bg: isPnLPositive ? 'from-green-50/50 to-transparent dark:from-green-950/20 dark:to-transparent' : 'from-red-50/50 to-transparent dark:from-red-950/20 dark:to-transparent',
          },
          {
            label: 'Account Status',
            value: 'Active',
            icon: FiCheck,
            color: 'text-green-600 dark:text-green-400',
            bg: 'from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent',
          },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-5 bg-gradient-to-br ${stat.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className={`text-xl font-extrabold font-mono ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Transactions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-4">Transaction History</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
              {transactions.map((tx, index) => {
                const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'INITIAL_DEPOSIT';
                const isBuy = tx.type === 'TRADE_BUY';
                const isSell = tx.type === 'TRADE_SELL';
                
                let typeColor = 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';
                let amountPrefix = '';
                if (isDeposit || isSell) {
                  typeColor = 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
                  amountPrefix = '+';
                } else if (isBuy) {
                  typeColor = 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
                  amountPrefix = '-';
                }

                return (
                  <tr key={tx._id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${typeColor}`}>
                        {isDeposit || isSell ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-200 font-bold">
                      {tx.description}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap text-sm ${
                      isDeposit || isSell ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {amountPrefix}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold ${
                        tx.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' : tx.status === 'PENDING' ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                      {formatDate(tx.timestamp || tx.date)}
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
