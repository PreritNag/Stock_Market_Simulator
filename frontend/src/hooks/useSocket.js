import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { updatePrices, updateLatestCandle } from '../store/marketSlice';

const SOCKET_URL = window.location.origin;

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState({});
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);
      if (user) {
        socket.emit('join_user_room', user.id || user._id);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected');
    });

    socket.on('priceUpdate', (data) => {
      if (Array.isArray(data)) {
        const priceMap = {};
        data.forEach((item) => {
          priceMap[item.symbol] = {
            currentPrice: item.currentPrice,
            change: item.change,
            changePercent: item.changePercent,
          };
        });
        setPrices((prev) => ({ ...prev, ...priceMap }));
        dispatch(updatePrices(data));
      }
    });

    socket.on('candleUpdate', (data) => {
      dispatch(updateLatestCandle(data));
    });

    socket.on('alert_triggered', (data) => {
      console.log('[Socket] Alert triggered:', data);
      toast.success(
        `Alert triggered: ${data.symbol} crossed target of ₹${data.value.toFixed(2)}! Current price: ₹${data.currentPrice.toFixed(2)}`,
        {
          duration: 8000,
          icon: '🔔',
        }
      );
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  useEffect(() => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('join_user_room', user.id || user._id);
    }
  }, [user]);

  const subscribe = useCallback((symbol) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', symbol);
    }
  }, []);

  const unsubscribe = useCallback((symbol) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', symbol);
    }
  }, []);

  return { prices, subscribe, unsubscribe, isConnected };
}
