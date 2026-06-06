import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiList } from 'react-icons/fi';
import TradeHistory from '../components/trading/TradeHistory';
import { fetchOrders } from '../store/portfolioSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Orders() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (loading && orders.length === 0) {
    return <LoadingSpinner size="lg" text="Loading trade history..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <FiList className="text-slate-700 dark:text-slate-400" size={22} />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Order History</h1>
      </div>

      {/* Trade History Panel */}
      <TradeHistory trades={orders} title="All Executed Orders" showSymbol={true} />
    </motion.div>
  );
}
