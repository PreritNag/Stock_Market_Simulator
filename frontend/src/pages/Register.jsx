import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { register, clearError, googleLogin } from '../store/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/common/Logo';
import toast from 'react-hot-toast';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => dispatch(clearError());
  }, [error, dispatch]);

  // Benefit slideshow rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Min 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(register({
      name: form.name,
      email: form.email,
      password: form.password,
    }));
  };

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return { strength: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;

    if (s <= 2) return { strength: (s / 5) * 100, label: 'Weak', color: 'bg-loss' };
    if (s <= 3) return { strength: (s / 5) * 100, label: 'Fair', color: 'bg-amber-500' };
    return { strength: (s / 5) * 100, label: 'Strong', color: 'bg-gain' };
  };

  const pw = passwordStrength();

  const slides = [
    {
      title: 'Practice Risk-Free',
      description: 'Start with ₹10,000 in virtual simulated cash and hone your stock trading strategies without risking real capital.',
    },
    {
      title: 'Real-Time simulated execution',
      description: 'Test trades against live data feeds with institutional-grade speed and execution latency.',
    },
    {
      title: 'Screener & Alerts',
      description: 'Set custom price thresholds and get instant push alerts when assets breakout or hit target boundaries.',
    },
  ];

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-[#080c14] transition-colors duration-300">
      {/* Left Branding Panel: Visible only on Desktop (lg and up) */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#050811] text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative Grid and Blurs */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[90px]" />

        {/* Top Header Logo */}
        <div className="relative z-10">
          <Logo size="md" variant="navbar" />
        </div>

        {/* Center Mock Live Trading Illustration */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full max-w-[460px] bg-slate-950/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md overflow-hidden shadow-2xl flex flex-col gap-6"
          >
            {/* Header Mockup */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIFTY 50 Live Sim</span>
              </div>
              <span className="text-xs font-bold font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded">+1.45%</span>
            </div>

            {/* SVG Graph path drawing */}
            <div className="relative h-36 w-full">
              <svg className="w-full h-full" viewBox="0 0 400 120">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Guideline lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Area under curve */}
                <motion.path
                  d="M 0 100 Q 50 80 100 90 T 200 40 T 300 60 T 400 20 L 400 120 L 0 120 Z"
                  fill="url(#chartGrad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5 }}
                />

                {/* Main Green Line */}
                <motion.path
                  d="M 0 100 Q 50 80 100 90 T 200 40 T 300 60 T 400 20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Secondary Golden Moving Average */}
                <motion.path
                  d="M 0 110 Q 70 95 120 100 T 220 65 T 320 75 T 400 35"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
                />

                {/* Glowing pointer */}
                <motion.circle
                  cx="400"
                  cy="20"
                  r="4"
                  fill="#10b981"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.8, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <circle cx="400" cy="20" r="8" fill="#10b981" fillOpacity="0.2" />
              </svg>
            </div>

            {/* Bottom Floating Stats Info */}
            <div className="flex gap-3 justify-between items-end mt-2">
              <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl backdrop-blur-lg">
                <span className="text-[8px] font-semibold text-slate-400 block uppercase">Virtual cash balance</span>
                <span className="text-xs font-bold font-mono text-white">₹10,000.00</span>
              </div>

              <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl backdrop-blur-lg text-right">
                <span className="text-[8px] font-semibold text-slate-400 block uppercase">latency</span>
                <span className="text-xs font-bold font-mono text-amber-400">⚡ Real-time</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Slideshow Benefits Footer */}
        <div className="relative z-10 h-24 max-w-[460px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-extrabold text-amber-400 uppercase tracking-widest">
                {slides[currentSlide].title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-1.5 mt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Responsive Background Bubbles (mobile/tablet fallback layout) */}
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-purple/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-[420px]"
        >
          {/* Card Container */}
          <div className="glass-card p-8 sm:p-10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/5">
            
            {/* Logo and Headings */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4 lg:hidden">
                <Logo size="lg" showText={false} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-2">
                Start trading with ₹10,000 virtual balance
              </p>
            </div>

            {/* Welcome virtual balance badge */}
            <div className="mb-6 p-3 rounded-xl bg-gain/5 border border-gain/10 flex items-center gap-3">
              <FiCheckCircle className="text-gain shrink-0" size={18} />
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                Sign up and get <span className="font-bold text-gain">₹10,000</span> virtual balance to practice stock trading risk-free!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <div
                  className={`relative rounded-xl transition-all duration-300 border ${
                    focusedField === 'name'
                      ? 'border-amber-400 ring-2 ring-amber-400/10'
                      : errors.name
                      ? 'border-loss'
                      : 'border-slate-200 dark:border-white/5'
                  }`}
                >
                  <FiUser
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'name' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                    size={16}
                  />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-white text-sm"
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] font-bold text-loss mt-1 ml-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div
                  className={`relative rounded-xl transition-all duration-300 border ${
                    focusedField === 'email'
                      ? 'border-amber-400 ring-2 ring-amber-400/10'
                      : errors.email
                      ? 'border-loss'
                      : 'border-slate-200 dark:border-white/5'
                  }`}
                >
                  <FiMail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                    size={16}
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-white text-sm"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] font-bold text-loss mt-1 ml-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div
                  className={`relative rounded-xl transition-all duration-300 border ${
                    focusedField === 'password'
                      ? 'border-amber-400 ring-2 ring-amber-400/10'
                      : errors.password
                      ? 'border-loss'
                      : 'border-slate-200 dark:border-white/5'
                  }`}
                >
                  <FiLock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'password' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                    size={16}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2.5 space-y-1 px-1">
                    <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <span>Password Strength</span>
                      <span className={
                        pw.label === 'Strong' ? 'text-gain' : pw.label === 'Fair' ? 'text-amber-500' : 'text-loss'
                      }>{pw.label}</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pw.strength}%` }}
                        className={`h-full rounded-full ${pw.color}`}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-[10px] font-bold text-loss mt-1 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <div
                  className={`relative rounded-xl transition-all duration-300 border ${
                    focusedField === 'confirmPassword'
                      ? 'border-amber-400 ring-2 ring-amber-400/10'
                      : errors.confirmPassword
                      ? 'border-loss'
                      : 'border-slate-200 dark:border-white/5'
                  }`}
                >
                  <FiLock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                      focusedField === 'confirmPassword' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                    size={16}
                  />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={onChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] font-bold text-loss mt-1 ml-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider mt-5"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <FiArrowRight size={14} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-white dark:bg-[#0f172a] px-3 text-slate-400 dark:text-slate-500 rounded">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Signup Wrapper */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    dispatch(googleLogin(credentialResponse.credential));
                  }
                }}
                onError={() => {
                  toast.error('Google registration failed. Please try again.');
                }}
                theme={isDark ? 'dark' : 'outline'}
                shape="rectangular"
                width="340px"
              />
            </div>

            {/* Redirect footer */}
            <div className="mt-8 text-center">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-extrabold transition-colors ml-1"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
