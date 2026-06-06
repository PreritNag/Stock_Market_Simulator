import marketReducer, {
  fetchStocks as fetchStocksThunk,
  fetchStockDetail as fetchStockDetailThunk,
  searchStocks as searchStocksThunk,
  updatePrices as updatePricesAction,
  clearSearchResults as clearSearchResultsAction,
  clearSelectedStock as clearSelectedStockAction
} from './marketSlice';

export const fetchStocks = fetchStocksThunk;
export const fetchStockDetail = fetchStockDetailThunk;
export const searchStocks = searchStocksThunk;
export const updatePrices = updatePricesAction;
export const clearSearchResults = clearSearchResultsAction;
export const clearSelectedStock = clearSelectedStockAction;

export default marketReducer;
