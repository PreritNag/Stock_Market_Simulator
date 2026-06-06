import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        className={`relative ${sizes[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-2 border-surface-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500" />
        <motion.div
          className="absolute inset-2 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <FiTrendingUp className="text-primary-400" size={size === 'sm' ? 14 : size === 'md' ? 20 : 28} />
        </motion.div>
      </motion.div>
      {text && (
        <motion.p
          className="text-gray-400 text-sm font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
