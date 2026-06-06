import api from './api';

export const orderApi = {
  placeOrder: (orderData) => api.post('/orders', orderData).then(res => res.data),
  getOrders: () => api.get('/orders').then(res => res.data),
  getPortfolio: () => api.get('/portfolio').then(res => res.data),
  getTradeHistory: () => api.get('/portfolio/history').then(res => res.data),
};

export default orderApi;
