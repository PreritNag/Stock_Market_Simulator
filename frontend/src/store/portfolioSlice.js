import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchPortfolio = createAsyncThunk('portfolio/fetchPortfolio', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/portfolio');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch portfolio');
  }
});

export const fetchOrders = createAsyncThunk('portfolio/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchTradeHistory = createAsyncThunk('portfolio/fetchTradeHistory', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/portfolio/history');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch trade history');
  }
});

export const fetchWallet = createAsyncThunk('portfolio/fetchWallet', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/wallet');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch wallet');
  }
});

export const placeOrder = createAsyncThunk('portfolio/placeOrder', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', orderData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Order failed');
  }
});

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState: {
    holdings: [],
    orders: [],
    tradeHistory: [],
    wallet: null,
    totalValue: 0,
    totalPnL: 0,
    loading: false,
    orderLoading: false,
    error: null,
  },
  reducers: {
    clearOrderError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.holdings = action.payload.portfolio || action.payload.holdings || [];
        state.totalValue = action.payload.totalCurrentValue || action.payload.totalValue || 0;
        state.totalPnL = action.payload.totalUnrealizedPnL || action.payload.totalPnL || 0;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : action.payload.orders || [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Trade History
      .addCase(fetchTradeHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTradeHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.tradeHistory = Array.isArray(action.payload) ? action.payload : action.payload.trades || [];
      })
      .addCase(fetchTradeHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Wallet
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload.wallet;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.orderLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        if (action.payload.order) {
          state.orders = [action.payload.order, ...state.orders];
        }
        if (action.payload.updatedBalance !== undefined) {
          if (state.wallet) {
            state.wallet.virtualBalance = action.payload.updatedBalance;
          } else {
            state.wallet = { virtualBalance: action.payload.updatedBalance };
          }
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload;
      })
      // Sync from walletSlice
      .addCase('wallet/fetchWallet/fulfilled', (state, action) => {
        state.wallet = action.payload.wallet;
      })
      .addCase('wallet/verifyPayment/fulfilled', (state, action) => {
        if (state.wallet) {
          state.wallet.virtualBalance = action.payload.virtualBalance;
        } else {
          state.wallet = { virtualBalance: action.payload.virtualBalance };
        }
      });
  },
});

export const { clearOrderError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
