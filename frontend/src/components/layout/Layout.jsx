import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Navbar from './Navbar';
import { fetchStocks } from '../../store/marketSlice';
import { fetchWallet } from '../../store/walletSlice';
import { useSocket } from '../../hooks/useSocket';

export default function Layout({ children }) {
  const dispatch = useDispatch();

  // Initialize socket connection
  useSocket();

  // Load initial data
  useEffect(() => {
    dispatch(fetchStocks());
    dispatch(fetchWallet());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="flex flex-col">
        <main className="flex-1 min-h-[calc(100vh-8rem)] p-4 lg:p-6 max-w-[1440px] w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
