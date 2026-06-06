import api from './api';

export const paymentApi = {
  createStripeSession: () => api.post('/payment/create-order').then(res => res.data),
  verifyStripePayment: (sessionId) => api.post('/payment/verify', { session_id: sessionId }).then(res => res.data),
  getWallet: () => api.get('/wallet').then(res => res.data),
  getWalletTransactions: () => api.get('/wallet/transactions').then(res => res.data),
};

export default paymentApi;
