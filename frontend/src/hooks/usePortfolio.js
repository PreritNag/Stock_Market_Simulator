import { useDispatch, useSelector } from 'react-redux';
import { fetchPortfolio, placeOrder, fetchOrders } from '../store/portfolioSlice';

/**
 * Custom hook to interact with the portfolio state and dispatch actions
 */
export const usePortfolio = () => {
  const dispatch = useDispatch();
  const portfolioState = useSelector((state) => state.portfolio);

  return {
    ...portfolioState,
    getPortfolio: () => dispatch(fetchPortfolio()),
    getOrders: () => dispatch(fetchOrders()),
    buyOrSell: (orderData) => dispatch(placeOrder(orderData))
  };
};

export default usePortfolio;
