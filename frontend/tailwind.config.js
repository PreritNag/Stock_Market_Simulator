/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#0a0f1d', // Midnight Indigo (BullCash brand primary)
          600: '#151b2e',
          700: '#0a0f1d',
          800: '#060a14',
          900: '#03050a',
          950: '#010204',
        },
        brand: {
          gold: '#f59e0b',
          'gold-light': '#fbbf24',
          'gold-dark': '#d97706',
          midnight: '#0a0f1d',
          'midnight-light': '#151b2e',
        },
        gain: {
          DEFAULT: '#10b981', // Emerald Green
          light: '#34d399',
          dark: '#059669',
          bg: 'rgba(16,185,129,0.1)',
        },
        loss: {
          DEFAULT: '#ef4444', // Coral Crimson
          light: '#f87171',
          dark: '#dc2626',
          bg: 'rgba(239,68,68,0.1)',
        },
        surface: {
          DEFAULT: '#f5f8fa', // Cool slate backdrop
          50: '#f5f8fa',
          100: '#eaedf2', // Border lines
          200: '#e1e5eb', // Hover backgrounds / outline inputs
          300: '#ffffff', // Cards (pure white)
          400: '#ffffff',
          500: '#f5f8fa',
          600: '#cbd5e1',
          700: '#94a3b8',
          dark: '#0a0f1d', // Midnight Indigo (navbar level 1)
        },
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          amber: '#f59e0b',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
        'card-gradient': 'linear-gradient(135deg, #ffffff, #f5f8fa)',
        'gain-gradient': 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
        'loss-gradient': 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
        'hero-gradient': 'linear-gradient(135deg, #ffffff 0%, #eaedf2 50%, #ffffff 100%)',
        'brand-gradient': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'midnight-gradient': 'linear-gradient(135deg, #0a0f1d, #151b2e)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(100,116,139,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glass-sm': '0 4px 16px rgba(100,116,139,0.03), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.15)',
        'glow-green': '0 0 20px rgba(16,185,129,0.15)',
        'glow-red': '0 0 20px rgba(239,68,68,0.15)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.15)',
        'card': '0 12px 40px rgba(100,116,139,0.035)',
        'card-hover': '0 20px 60px rgba(100,116,139,0.06), 0 4px 16px rgba(100,116,139,0.03)',
        'premium': '0 24px 48px rgba(10,15,29,0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'ticker': 'ticker 30s linear infinite',
        'flash-green': 'flashGreen 0.6s ease-out',
        'flash-red': 'flashRed 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        flashGreen: {
          '0%': { backgroundColor: 'rgba(16,185,129,0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239,68,68,0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
