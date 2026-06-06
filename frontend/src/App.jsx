import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { loadUser } from './store/authSlice';
import { registerPushNotifications } from './utils/PushNotificationManager';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Wallet from './pages/Wallet';
import Markets from './pages/Markets';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import Screener from './pages/Screener';
import Community from './pages/Community';
import Watchlists from './pages/Watchlists';
import IPOs from './pages/IPOs';
import Positions from './pages/Positions';
import PnLCalendar from './pages/PnLCalendar';
import Settings from './pages/Settings';

export default function App() {
  const dispatch = useDispatch();
  const { loading, token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (isAuthenticated) {
      registerPushNotifications();
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking auth on first load
  if (loading && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingSpinner size="lg" text="Loading BullCash..." />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trade/:symbol"
          element={
            <ProtectedRoute>
              <Layout>
                <Trade />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Layout>
                <Portfolio />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Layout>
                <Wallet />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/markets"
          element={
            <ProtectedRoute>
              <Layout>
                <Markets />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/screener"
          element={
            <ProtectedRoute>
              <Layout>
                <Screener />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <Layout>
                <Community />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlists"
          element={
            <ProtectedRoute>
              <Layout>
                <Watchlists />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ipos"
          element={
            <ProtectedRoute>
              <Layout>
                <IPOs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/positions"
          element={
            <ProtectedRoute>
              <Layout>
                <Positions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pnl-calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <PnLCalendar />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
