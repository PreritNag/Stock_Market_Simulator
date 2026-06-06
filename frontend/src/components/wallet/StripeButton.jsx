import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { paymentApi } from '../../services/paymentApi';

export default function StripeButton() {
  const [loading, setLoading] = useState(false);

  const handleTopUp = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.createStripeSession();
      if (data.url) {
        toast.loading('Redirecting to secure payment checkout...');
        window.location.href = data.url;
      } else {
        toast.error('Failed to get payment checkout URL');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate top-up session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleTopUp}
      disabled={loading}
      className="btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50 font-semibold px-6 py-3.5"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Connecting Gateway...
        </>
      ) : (
        <>
          <FiPlus size={16} />
          Top Up Wallet (₹1)
        </>
      )}
    </motion.button>
  );
}
