import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchStocks = createAsyncThunk('market/fetchStocks', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/stocks');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stocks');
  }
});

export const fetchStockDetail = createAsyncThunk('market/fetchStockDetail', async (symbol, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/stocks/${symbol}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stock detail');
  }
});

export const searchStocks = createAsyncThunk('market/searchStocks', async (query, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/stocks/search?q=${encodeURIComponent(query)}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Search failed');
  }
});

const marketSlice = createSlice({
  name: 'market',
  initialState: {
    stocks: [],
    searchResults: [],
    selectedStock: null,
    ohlcvData: [],
    loading: false,
    searchLoading: false,
    error: null,
    activePrimaryTab: 'BullForge',
  },
  reducers: {
    setActivePrimaryTab(state, action) {
      state.activePrimaryTab = action.payload;
    },
    updatePrices(state, action) {
      const updates = action.payload;
      if (!Array.isArray(updates)) return;
      updates.forEach((update) => {
        const idx = state.stocks.findIndex((s) => s.symbol === update.symbol);
        if (idx !== -1) {
          state.stocks[idx] = { ...state.stocks[idx], ...update };
        }
        if (state.selectedStock?.symbol === update.symbol) {
          state.selectedStock = { ...state.selectedStock, ...update };
        }
      });
    },
    clearSearchResults(state) {
      state.searchResults = [];
    },
    clearSelectedStock(state) {
      state.selectedStock = null;
      state.ohlcvData = [];
    },
    updateLatestCandle(state, action) {
      const { symbol, candle, currentPrice, change, changePercent } = action.payload;
      if (state.selectedStock?.symbol === symbol) {
        state.selectedStock.currentPrice = currentPrice;
        state.selectedStock.change = change;
        state.selectedStock.changePercent = changePercent;

        const candles = [...state.ohlcvData];
        if (candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          const newTime = candle.time ? Number(candle.time) : (candle.date ? Math.floor(new Date(candle.date).getTime() / 1000) : 0);
          const lastTime = lastCandle.time ? Number(lastCandle.time) : (lastCandle.date ? Math.floor(new Date(lastCandle.date).getTime() / 1000) : 0);

          if (newTime === lastTime) {
            candles[candles.length - 1] = { ...lastCandle, ...candle };
          } else if (newTime > lastTime) {
            candles.push(candle);
          }
        } else {
          candles.push(candle);
        }

        state.ohlcvData = candles.slice(-500);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stocks
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = Array.isArray(action.payload) ? action.payload : action.payload.stocks || [];
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch stock detail
      .addCase(fetchStockDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStockDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStock = action.payload.stock;
        state.ohlcvData = action.payload.stock?.ohlcv || action.payload.stock?.history || [];
      })
      .addCase(fetchStockDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search
      .addCase(searchStocks.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchStocks.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(searchStocks.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setActivePrimaryTab, updatePrices, clearSearchResults, clearSelectedStock, updateLatestCandle } = marketSlice.actions;
export default marketSlice.reducer;
