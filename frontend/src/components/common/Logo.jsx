import { motion } from 'framer-motion';

export default function Logo({ size = 'md', showText = true, variant = 'default' }) {
  // Size maps for the icon container and SVG width/height
  const iconSizes = {
    sm: { container: 'w-8 h-8 rounded-lg', svg: 16 },
    md: { container: 'w-9.5 h-9.5 rounded-xl', svg: 20 },
    lg: { container: 'w-14 h-14 rounded-2xl', svg: 28 },
    xl: { container: 'w-18 h-18 rounded-[20px]', svg: 36 },
  };

  // Size maps for the text sizing
  const textSizes = {
    sm: 'text-sm font-extrabold tracking-tight',
    md: 'text-base font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
  };

  const selectedSize = iconSizes[size] || iconSizes.md;
  const selectedTextSize = textSizes[size] || textSizes.md;

  // Variant classes for the text coloring
  const textColors = {
    default: 'text-slate-900 dark:text-white',
    navbar: 'text-white',
  };

  const selectedTextColor = textColors[variant] || textColors.default;

  return (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      {/* Animated Icon Container */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`${selectedSize.container} bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow duration-300`}
      >
        <svg
          width={selectedSize.svg}
          height={selectedSize.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated Bull Horn Outer Shape */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            d="M4 8L8 4L12 12L16 4L20 8L18 20H6L4 8Z"
            fill="#0a0f1d"
            stroke="#0a0f1d"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner Rising Horn Chart Line */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            d="M9 14L12 10L15 14"
            stroke="#fbbf24"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Brand Text */}
      {showText && (
        <span className={`${selectedTextSize} ${selectedTextColor} transition-colors duration-300`}>
          Bull<span className="text-amber-400 group-hover:text-amber-300 transition-colors">Cash</span>
        </span>
      )}
    </div>
  );
}
