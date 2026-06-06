import api from './api';

export const stockApi = {
  getStocks: () => api.get('/stocks').then(res => res.data),
  getStockDetail: (symbol) => api.get(`/stocks/${symbol}`).then(res => res.data),
  searchStocks: (query) => api.get(`/stocks/search?q=${encodeURIComponent(query)}`).then(res => res.data),
  getWatchlist: () => api.get('/watchlist').then(res => res.data),
  addToWatchlist: (symbol) => api.post('/watchlist', { symbol }).then(res => res.data),
  removeFromWatchlist: (symbol) => api.delete(`/watchlist/${symbol}`).then(res => res.data),
};

export default stockApi;
