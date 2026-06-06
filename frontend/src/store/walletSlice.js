import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { paymentApi } from '../services/paymentApi';

export const fetchWallet = createAsyncThunk('wallet/fetchWallet', async (_, { rejectWithValue }) => {
  try {
    const data = await paymentApi.getWallet();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch wallet');
  }
});

export const fetchTransactions = createAsyncThunk('wallet/fetchTransactions', async (_, { rejectWithValue }) => {
  try {
    const data = await paymentApi.getWalletTransactions();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch transactions');
  }
});

export const verifyPayment = createAsyncThunk('wallet/verifyPayment', async (sessionId, { rejectWithValue }) => {
  try {
    const data = await paymentApi.verifyStripePayment(sessionId);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to verify payment');
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 10000,
    transactions: [],
    loading: false,
    error: null,
    verifySuccess: false,
  },
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    resetVerifyState: (state) => {
      state.verifySuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wallet
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.wallet?.virtualBalance ?? 10000;
        state.error = null;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions || [];
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.virtualBalance;
        state.verifySuccess = true;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sync from portfolioSlice
      .addCase('portfolio/fetchWallet/fulfilled', (state, action) => {
        state.balance = action.payload.wallet?.virtualBalance ?? 10000;
      })
      .addCase('portfolio/placeOrder/fulfilled', (state, action) => {
        if (action.payload.updatedBalance !== undefined) {
          state.balance = action.payload.updatedBalance;
        }
      });
  }
});

export const { clearWalletError, resetVerifyState } = walletSlice.actions;
export default walletSlice.reducer;
