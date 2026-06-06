import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { verifyPayment, fetchWallet } from '../../store/walletSlice';
import { paymentApi } from '../../services/paymentApi';

export default function RazorpayButton({ onSuccess }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleTopUp = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.createRazorpayOrder();
      
      const options = {
        key: data.key_id || data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'StockSim',
        description: 'Wallet Top-Up – Virtual Balance',
        order_id: data.order_id || data.orderId,
        handler: async function (response) {
          try {
            const result = await dispatch(verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();

            toast.success(`Wallet topped up successfully!`);
            dispatch(fetchWallet());
            if (onSuccess) onSuccess(result.virtualBalance);
          } catch (err) {
            toast.error(err || 'Payment verification failed');
          }
        },
        prefill: {
          name: 'StockSim User',
          email: 'user@stocksim.com',
        },
        theme: {
          color: '#0ea5e9',
          backdrop_color: '#0f1117',
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Payment gateway not loaded. Please refresh the page.');
      }
    } catch (err) {
      toast.error('Failed to initiate top-up order');
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
