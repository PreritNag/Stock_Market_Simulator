import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiSearch, FiSliders, FiBookOpen, FiArrowUpRight } from 'react-icons/fi';
import { fetchStocks } from '../store/marketSlice';
import { fetchPortfolio } from '../store/portfolioSlice';
import { fetchWallet } from '../store/walletSlice';
import StockDetailDrawer from '../components/dashboard/StockDetailDrawer';
import { getStockIcon } from '../utils/stockIcons';

// Mini sparkline for tables
const MiniSparkline = ({ points, isPositive }) => {
  if (!points || points.length < 2) {
    return (
      <svg className="w-16 h-6" viewBox="0 0 60 20">
        <path d="M0,10 Q15,4 30,12 T60,8" fill="none" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth="1.5" />
      </svg>
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const svgPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * 60;
    const y = 18 - ((p - min) / range) * 16;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-16 h-6">
      <polyline
        fill="none"
        stroke={isPositive ? '#10b981' : '#ef4444'}
        strokeWidth="1.5"
        points={svgPoints}
      />
    </svg>
  );
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stocks, activePrimaryTab } = useSelector((state) => state.market);
  const { holdings, totalValue, totalPnL } = useSelector((state) => state.portfolio);
  const { balance = 10000 } = useSelector((state) => state.wallet);
  
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [capFilter, setCapFilter] = useState('Large Cap');
  const [momentumTimeframe, setMomentumTimeframe] = useState('5 mins');
  const [signalFilter, setSignalFilter] = useState('Hot Now');
  const [patternFilter, setPatternFilter] = useState('Resistance');

  useEffect(() => {
    dispatch(fetchStocks());
    dispatch(fetchPortfolio());
    dispatch(fetchWallet());
  }, [dispatch]);

  // Extract index values
  const indices = useMemo(() => {
    const nifty = stocks.find(s => s.symbol === 'NIFTY50') || { currentPrice: 23391.40, changePercent: 0.14, change: 31.65 };
    const sensex = stocks.find(s => s.symbol === 'SENSEX') || { currentPrice: 74313.99, changePercent: -0.06, change: -46.02 };
    
    const bankNiftyPrice = 54450.80;
    const bankNiftyPercent = 0.26;
    const bankNiftyChange = 142.10;

    return { nifty, sensex, bankNifty: { currentPrice: bankNiftyPrice, changePercent: bankNiftyPercent, change: bankNiftyChange } };
  }, [stocks]);

  // Dynamically group/filter stocks based on cap
  const filteredGainers = useMemo(() => {
    const sorted = [...stocks]
      .filter(s => s.category === 'STOCK')
      .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));

    if (capFilter === 'Large Cap') {
      return sorted.filter(s => (s.marketCap || 0) >= 500000).slice(0, 5);
    }
    if (capFilter === 'Mid Cap') {
      return sorted.filter(s => (s.marketCap || 0) >= 100000 && (s.marketCap || 0) < 500000).slice(0, 5);
    }
    if (capFilter === 'Small Cap') {
      return sorted.filter(s => (s.marketCap || 0) < 100000).slice(0, 5);
    }
    return sorted.slice(0, 5);
  }, [stocks, capFilter]);

  // Extract sparkline values
  const getSparklinePoints = (stock) => {
    if (stock.ohlcv && stock.ohlcv.length > 0) {
      return stock.ohlcv.slice(-10).map(c => c.close);
    }
    const p = stock.currentPrice || 100;
    const ch = stock.change || 0;
    return [p - ch, p - ch * 0.8, p - ch * 0.5, p - ch * 0.2, p];
  };

  const renderIndianStocks = () => {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide">
          BullForge / <span className="text-slate-800 dark:text-slate-350">Explore</span>
        </div>

        {/* Desktop Split Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Indices Ticker Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'NIFTY 50', val: indices.nifty.currentPrice, ch: indices.nifty.change, chPct: indices.nifty.changePercent, pts: [23310, 23340, 23320, 23360, 23350, 23391.4] },
                { name: 'SENSEX', val: indices.sensex.currentPrice, ch: indices.sensex.change, chPct: indices.sensex.changePercent, pts: [74450, 74400, 74320, 74350, 74300, 74313.99] },
                { name: 'BANK NIFTY', val: indices.bankNifty.currentPrice, ch: indices.bankNifty.change, chPct: indices.bankNifty.changePercent, pts: [54200, 54300, 54250, 54380, 54410, 54450.8] }
              ].map((idx) => {
                const isPos = idx.chPct >= 0;
                return (
                  <div key={idx.name} className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">{idx.name}</p>
                      <p className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
                        {Number(idx.val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center gap-1 text-xs font-semibold mt-1.5 ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        <span>{isPos ? '+' : ''}{Number(idx.ch).toFixed(2)}</span>
                        <span>({isPos ? '+' : ''}{Number(idx.chPct).toFixed(2)}%)</span>
                      </div>
                    </div>
                    <div className="w-16 h-8 opacity-80 shrink-0">
                      <MiniSparkline points={idx.pts} isPositive={isPos} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Gainers Table Widget */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Top Gainers today</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Large Cap', 'Mid Cap', 'Small Cap', 'Nifty 500'].map((cap) => (
                    <button
                      key={cap}
                      onClick={() => setCapFilter(cap)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                        capFilter === cap
                          ? 'bg-slate-900 border-slate-900 text-white dark:bg-amber-500 dark:border-amber-500 dark:text-slate-900'
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-450 dark:text-slate-500 font-extrabold border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 pr-4 font-semibold uppercase tracking-wider">Stock Name</th>
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-center">Chart</th>
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-right">Price / 1D Change</th>
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-right">52W High</th>
                      <th className="pb-3 pl-4 font-semibold uppercase tracking-wider text-right">Market Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredGainers.map((stock) => {
                      const isPos = (stock.changePercent || 0) >= 0;
                      const sparkPoints = getSparklinePoints(stock);
                      return (
                        <tr
                          key={stock.symbol}
                          onClick={() => setSelectedSymbol(stock.symbol)}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                isPos ? 'bg-green-55 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                              }`}>
                                {getStockIcon(stock.symbol)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 dark:text-white">{stock.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{stock.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-block">
                              <MiniSparkline points={sparkPoints} isPositive={isPos} />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <p className="font-bold text-slate-800 dark:text-white">
                              ₹{Number(stock.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-[10px] font-bold mt-0.5 ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                              {Number(stock.change || 0).toFixed(2)} ({isPos ? '▲' : '▼'}{Math.abs(stock.changePercent || 0).toFixed(2)}%)
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-650 dark:text-slate-400">
                            ₹{Number(stock.currentPrice * 1.12 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 pl-4 text-right font-mono font-bold text-slate-650 dark:text-slate-400">
                            {Number(stock.volume || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side-by-side Technical Signals & Patterns Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Trading Signals Widget */}
              <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Trading Signals</h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Hot Now', 'MACD', 'Over Bought'].map((sig) => (
                      <button
                        key={sig}
                        onClick={() => setSignalFilter(sig)}
                        className={`text-[8px] font-bold px-2 py-1 rounded-full transition-colors border ${
                          signalFilter === sig
                            ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-700'
                        }`}
                      >
                        {sig}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 font-extrabold border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-2 font-semibold">Stock Name</th>
                        <th className="pb-2 text-right">Price / 1D Chg</th>
                        <th className="pb-2 text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stocks.slice(3, 7).map((stock) => {
                        const isPos = stock.changePercent >= 0;
                        return (
                          <tr key={stock.symbol} onClick={() => setSelectedSymbol(stock.symbol)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer">
                            <td className="py-2.5">
                              <span className="font-bold text-slate-800 dark:text-white block">{stock.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{stock.symbol}</span>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="font-bold text-slate-800 dark:text-white block">₹{Number(stock.currentPrice).toFixed(2)}</span>
                              <span className={`text-[9px] font-bold ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                {Number(stock.change).toFixed(2)} ({isPos ? '+' : ''}{Number(stock.changePercent).toFixed(2)}%)
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-500 dark:text-slate-400">
                              {(stock.volume / 1000).toFixed(0)}K
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trading Patterns Widget */}
              <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Breakout Patterns</h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Resistance', 'Rising Wedge'].map((pat) => (
                      <button
                        key={pat}
                        onClick={() => setPatternFilter(pat)}
                        className={`text-[8px] font-bold px-2 py-1 rounded transition-all border ${
                          patternFilter === pat
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-amber-500 dark:border-amber-500 dark:text-slate-900'
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stocks.slice(0, 2).map((stock, index) => {
                    const mockPrices = [284.10, 189.90][index];
                    const mockChanges = [-0.50, 0.63][index];
                    const mockPercents = [-0.18, 0.33][index];
                    const isPos = mockChanges >= 0;

                    return (
                      <div
                        key={stock.symbol}
                        onClick={() => setSelectedSymbol(stock.symbol)}
                        className="border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750 transition-all rounded-xl p-3 cursor-pointer hover:shadow-xs bg-slate-50/50 dark:bg-slate-800/10 flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                            {getStockIcon(stock.symbol)}
                          </div>
                          <span className="font-extrabold text-[10px] text-slate-850 dark:text-white truncate block max-w-[80px]">{stock.name}</span>
                        </div>
                        <div className="mb-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">₹{mockPrices.toFixed(2)}</span>
                          <span className={`block font-bold text-[8px] mt-0.5 ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {isPos ? '+' : ''}{mockChanges.toFixed(2)} ({isPos ? '+' : ''}{mockPercents.toFixed(2)}%)
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 italic leading-tight">
                          {patternFilter === 'Resistance'
                            ? 'Price struggles to move above a level.'
                            : 'Active dynamic channels detected.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Trading Patterns Full Row Widget */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Advanced Patterns Detection</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stocks.slice(0, 4).map((stock, index) => {
                  const mockPrices = [284.10, 189.90, 589.35, 25.14][index];
                  const mockChanges = [-0.50, 0.63, -0.15, 0.07][index];
                  const mockPercents = [-0.18, 0.33, -0.03, 0.28][index];
                  const isPos = mockChanges >= 0;

                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => setSelectedSymbol(stock.symbol)}
                      className="border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750 hover:shadow-xs transition-all rounded-xl p-3.5 cursor-pointer bg-slate-50/50 dark:bg-slate-800/10 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                          {getStockIcon(stock.symbol)}
                        </div>
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-white truncate block max-w-[90px]">{stock.name}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">₹{mockPrices.toFixed(2)}</span>
                        <span className={`block font-bold text-[8px] mt-0.5 ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {isPos ? '+' : ''}{mockChanges.toFixed(2)} ({isPos ? '+' : ''}{mockPercents.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-450 dark:text-slate-500 italic leading-normal border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
                        {patternFilter === 'Resistance'
                          ? 'Bearish rejection signals possible correction'
                          : 'Dynamic channel breakouts within trend lines'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sidebar Column (1/3 width) */}
          <div className="space-y-6">
            
            {/* Account Summary Card */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Account Overview
                </h3>
                <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded uppercase">
                  Simulated Live
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Account Value</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-mono">
                  ₹{(totalValue + balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Virtual Cash</span>
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Stock Value</span>
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                    ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <FiActivity size={14} className="text-slate-400 dark:text-slate-500" />
                  <span>Unrealized Profit & Loss</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-extrabold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {totalPnL >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                  <span className="font-mono">
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Cash vs Stock ratio Allocation */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <span>Asset Allocation Ratio</span>
                  <span>{((balance / (totalValue + balance || 1)) * 100).toFixed(0)}% Cash</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${(balance / (totalValue + balance || 1)) * 100}%` }}
                    title="Virtual Cash"
                  />
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${(totalValue / (totalValue + balance || 1)) * 100}%` }}
                    title="Stock Holdings"
                  />
                </div>
                <div className="flex gap-4 text-[9px] text-slate-400 dark:text-slate-500 justify-end pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Cash
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Stocks
                  </span>
                </div>
              </div>
            </div>

            {/* Intraday Momentum Widget */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Intraday Momentum</h3>
                </div>
                <div className="flex items-center gap-1">
                  {['5m', '15m', '1h'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setMomentumTimeframe(time === '5m' ? '5 mins' : time === '15m' ? '15 mins' : '1 hour')}
                      className={`text-[8px] font-bold px-2 py-0.5 rounded transition-colors ${
                        (momentumTimeframe.startsWith('5') && time === '5m') ||
                        (momentumTimeframe.startsWith('15') && time === '15m') ||
                        (momentumTimeframe.startsWith('1') && time === '15m' === false && time === '5m' === false)
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-900'
                          : 'bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-extrabold border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-2 font-semibold">Stock Name</th>
                      <th className="pb-2 text-center">Momentum</th>
                      <th className="pb-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stocks.slice(1, 4).map((stock, idx) => {
                      const mockMomentum = [2.67, 1.45, 3.22, 0.98][idx];
                      return (
                        <tr key={stock.symbol} onClick={() => setSelectedSymbol(stock.symbol)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer">
                          <td className="py-2.5">
                            <span className="font-bold text-slate-850 dark:text-white block">{stock.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{stock.symbol}</span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="text-green-600 dark:text-green-400 font-extrabold text-[10px]">+{mockMomentum}%</span>
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="font-bold text-slate-800 dark:text-white block">₹{Number(stock.currentPrice).toFixed(2)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3Y Multibaggers */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">3Y Multibaggers</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'GE Vernova', pct: 2588.42, symbol: 'INFY' },
                  { name: 'BSE Ltd', pct: 1998.22, symbol: 'TCS' },
                  { name: 'Multi Comm.', pct: 884.75, symbol: 'RELIANCE' },
                  { name: 'Hitachi Energy', pct: 842.73, symbol: 'MARUTI' },
                ].map((st) => (
                  <div
                    key={st.name}
                    onClick={() => setSelectedSymbol(st.symbol)}
                    className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/10 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 mb-1.5">
                        {getStockIcon(st.symbol)}
                      </div>
                      <span className="font-extrabold text-[10px] text-slate-800 dark:text-white block truncate">{st.name}</span>
                    </div>
                    <div className="mt-2.5">
                      <span className="text-green-600 dark:text-green-400 font-extrabold text-xs block">▲{st.pct}%</span>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">3Y Returns</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  };

  const renderUSStocks = () => {
    return (
      <div className="space-y-6">
        
        {/* US Indices Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { name: 'Nasdaq Comp', val: 16850.04, ch: -2.69, chPct: -0.01 },
            { name: 'Nasdaq 100', val: 30432.97, ch: -137.57, chPct: -0.45 },
            { name: 'Dow Jones', val: 51589.07, ch: 902.23, chPct: 1.78 },
            { name: 'S&P 500', val: 3759.71, ch: 15.72, chPct: 0.42 },
            { name: 'Russell 2000', val: 2110.15, ch: 8.52, chPct: 0.40 }
          ].map((idx) => {
            const isPos = idx.chPct >= 0;
            return (
              <div key={idx.name} className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-405 dark:text-slate-500 block tracking-wider">{idx.name}</span>
                <span className="font-extrabold text-xs text-slate-800 dark:text-white block mt-0.5">{idx.val.toLocaleString('en-US')}</span>
                <span className={`text-[9px] font-bold ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}{idx.chPct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide">
          US Stocks / <span className="text-slate-800 dark:text-slate-350">Explore & Invest</span>
        </div>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hero Performance Card */}
          <div className="lg:col-span-2 bg-[#0d1e3d] dark:bg-[#0a162e] text-white p-6 rounded-2xl flex flex-col justify-between min-h-[180px] border border-slate-200/5 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl" />
            <div>
              <span className="text-[10px] font-bold tracking-wider text-blue-300 uppercase">Interactive simulation</span>
              <h3 className="text-xl font-bold tracking-tight mt-1">Start Trading Major US Tech & Growth Assets</h3>
            </div>
            <div>
              <span className="text-xs text-blue-200 block">1 day change</span>
              <span className="text-2xl font-extrabold font-mono tracking-tight">$0.00</span>
            </div>
          </div>

          {/* Trending Stocks Sidebar */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trending Stocks</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: 'ASML Holding N.V.', ticker: 'ASML', val: 757.47, pct: 2.97 },
                { name: 'Apple Inc.', ticker: 'AAPL', val: 181.25, pct: -0.42 },
                { name: 'Tesla Inc.', ticker: 'TSLA', val: 177.46, pct: 1.15 }
              ].map((us) => (
                <div key={us.ticker} className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/10 rounded-lg px-1">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white block">{us.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{us.ticker}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-white">${us.val.toFixed(2)}</span>
                    <span className={`block text-[9px] font-bold ${us.pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {us.pct >= 0 ? '+' : ''}{us.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* US Collections & Screener grids */}
        <div className="space-y-6">
          
          {/* Explore Collections */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Explore US Stocks Collections</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Top Tech Stocks', desc: 'Invest in Mega-cap Silicon Valley giants' },
                { name: 'Warren Buffet Portfolio', desc: 'Value assets matching Berkshire holdings' },
                { name: 'Top Consumer Brands', desc: 'Leading global retail and consumer names' },
                { name: 'ETFs & Index Funds', desc: 'Diversified broad market SPY/QQQ baskets' }
              ].map((col) => (
                <div key={col.name} className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-4 rounded-xl hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 font-bold">
                    🚀
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white leading-tight">{col.name}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">{col.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Themes */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Explore Themes in US Stocks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Top E-commerce Stocks', 'Top Metaverse Stocks', 'Top Energy Stocks', 'Top Electric Vehicles (EV)'].map((theme) => (
                <div key={theme} className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-4 rounded-xl hover:shadow-sm transition-all cursor-pointer flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-xs">
                    🎨
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-white leading-tight">{theme}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  };

  const renderMutualFunds = () => {
    const mfCategories = [
      { name: 'Equity Funds', count: 142, avgReturn: 18.4, icon: '📈' },
      { name: 'Debt Funds', count: 89, avgReturn: 7.2, icon: '🏦' },
      { name: 'Hybrid Funds', count: 56, avgReturn: 12.8, icon: '⚖️' },
      { name: 'ELSS (Tax Saving)', count: 38, avgReturn: 16.5, icon: '💰' },
    ];

    const topFunds = [
      { name: 'Axis Bluechip Fund', category: 'Large Cap', nav: 52.34, return1y: 22.4, return3y: 16.8, aum: '34,200 Cr', risk: 'Moderate' },
      { name: 'Mirae Asset Emerging', category: 'Large & Mid', nav: 98.76, return1y: 28.7, return3y: 19.2, aum: '28,900 Cr', risk: 'Moderate High' },
      { name: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', nav: 68.45, return1y: 25.1, return3y: 21.5, aum: '51,400 Cr', risk: 'Moderate' },
      { name: 'SBI Small Cap Fund', category: 'Small Cap', nav: 142.88, return1y: 35.6, return3y: 24.3, aum: '22,100 Cr', risk: 'High' },
      { name: 'HDFC Mid-Cap Opp.', category: 'Mid Cap', nav: 112.33, return1y: 31.2, return3y: 22.1, aum: '41,800 Cr', risk: 'High' },
    ];

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide">
          BullForge / <span className="text-slate-800 dark:text-slate-350">Mutual Funds</span>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#0a0f1d] to-[#1a2340] text-white p-6 rounded-2xl relative overflow-hidden border border-slate-200/5 dark:border-slate-850 shadow-sm">
          <div className="absolute right-0 top-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
          <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">SIP & Lump Sum</span>
          <h3 className="text-xl font-bold tracking-tight mt-1">Invest in Top-Rated Mutual Funds</h3>
          <p className="text-xs sm:text-sm text-slate-350 mt-2">Start SIP with as low as ₹500/month</p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mfCategories.map((cat) => (
            <div key={cat.name} className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-5 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
              <span className="text-2xl mb-2 block">{cat.icon}</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{cat.name}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{cat.count} funds</p>
              <p className="text-green-600 dark:text-green-400 font-extrabold text-xs mt-2">Avg {cat.avgReturn}% p.a.</p>
            </div>
          ))}
        </div>

        {/* Top Performing Funds */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Top Performing Funds</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">Fund Name</th>
                  <th className="py-3 px-5 text-right">NAV</th>
                  <th className="py-3 px-5 text-right">1Y Return</th>
                  <th className="py-3 px-5 text-right">3Y Return</th>
                  <th className="py-3 px-5 text-right">AUM</th>
                  <th className="py-3 px-5 text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topFunds.map((fund) => (
                  <tr key={fund.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-extrabold text-slate-800 dark:text-white">{fund.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{fund.category}</p>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-slate-800 dark:text-white">₹{fund.nav.toFixed(2)}</td>
                    <td className="py-4 px-5 text-right font-bold text-green-600 dark:text-green-400">+{fund.return1y}%</td>
                    <td className="py-4 px-5 text-right font-bold text-green-600 dark:text-green-400">+{fund.return3y}%</td>
                    <td className="py-4 px-5 text-right font-mono text-slate-500 dark:text-slate-400">₹{fund.aum}</td>
                    <td className="py-4 px-5 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        fund.risk === 'High' ? 'bg-red-50 text-red-650 dark:bg-red-500/10 dark:text-red-400' :
                        fund.risk === 'Moderate High' ? 'bg-amber-50 text-amber-650 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-green-50 text-green-650 dark:bg-green-500/10 dark:text-green-400'
                      }`}>{fund.risk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFnO = () => {
    const optionsChain = [
      { strike: 23300, callLTP: 145.50, callOI: 125400, callChange: 12.3, putLTP: 52.80, putOI: 98200, putChange: -8.5 },
      { strike: 23350, callLTP: 112.30, callOI: 142000, callChange: 8.7, putLTP: 68.40, putOI: 110500, putChange: -5.2 },
      { strike: 23400, callLTP: 84.60, callOI: 168900, callChange: -3.2, putLTP: 89.20, putOI: 135800, putChange: 6.1 },
      { strike: 23450, callLTP: 62.10, callOI: 195200, callChange: -8.4, putLTP: 118.70, putOI: 155300, putChange: 14.3 },
      { strike: 23500, callLTP: 44.80, callOI: 230100, callChange: -15.6, putLTP: 152.40, putOI: 178600, putChange: 22.8 },
    ];

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide">
          BullForge / <span className="text-slate-800 dark:text-slate-350">Futures & Options</span>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#0a0f1d] to-[#1a2340] text-white p-6 rounded-2xl relative overflow-hidden border border-slate-200/5 dark:border-slate-850 shadow-sm">
          <div className="absolute right-0 top-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
          <span className="text-[10px] font-bold tracking-wider text-blue-300 uppercase">Derivatives Trading</span>
          <h3 className="text-xl font-bold tracking-tight mt-1">NIFTY 50 Options Chain</h3>
          <p className="text-xs sm:text-sm text-slate-350 mt-2">Expiry: 05 Jun 2026 • Spot: 23,391.40</p>
        </div>

        {/* Options Chain Table */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">Options Chain — NIFTY</h3>
            <div className="flex items-center gap-1.5">
              {['Weekly', 'Monthly'].map((exp) => (
                <button key={exp} className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full border ${
                  exp === 'Weekly'
                    ? 'bg-[#0a0f1d] border-[#0a0f1d] text-white dark:bg-amber-500 dark:border-amber-500 dark:text-[#0a0f1d]'
                    : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                }`}>{exp}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px]">
                  <th colSpan="3" className="py-2.5 px-4 text-center text-green-600 dark:text-green-400 font-bold uppercase tracking-wider bg-green-50/50 dark:bg-green-500/5">Calls</th>
                  <th className="py-2.5 px-4 text-center font-bold text-slate-800 dark:text-white uppercase tracking-wider bg-slate-100/50 dark:bg-slate-800/40">Strike</th>
                  <th colSpan="3" className="py-2.5 px-4 text-center text-red-500 dark:text-red-400 font-bold uppercase tracking-wider bg-red-50/50 dark:bg-red-500/5">Puts</th>
                </tr>
                <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[9px]">
                  <th className="py-2 px-4 text-right bg-green-50/20 dark:bg-green-500/5">OI</th>
                  <th className="py-2 px-4 text-right bg-green-50/20 dark:bg-green-500/5">Chg%</th>
                  <th className="py-2 px-4 text-right bg-green-50/20 dark:bg-green-500/5">LTP</th>
                  <th className="py-2 px-4 text-center bg-slate-50/30 dark:bg-slate-800/10">Price</th>
                  <th className="py-2 px-4 text-right bg-red-50/20 dark:bg-red-500/5">LTP</th>
                  <th className="py-2 px-4 text-right bg-red-50/20 dark:bg-red-500/5">Chg%</th>
                  <th className="py-2 px-4 text-right bg-red-50/20 dark:bg-red-500/5">OI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {optionsChain.map((row) => (
                  <tr key={row.strike} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer transition-colors">
                    <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 bg-green-50/5 dark:bg-green-500/5">
                      {(row.callOI / 1000).toFixed(1)}K
                    </td>
                    <td className={`py-3 px-4 text-right font-bold bg-green-50/5 dark:bg-green-500/5 ${row.callChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {row.callChange >= 0 ? '+' : ''}{row.callChange}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-green-700 dark:text-green-400 bg-green-50/5 dark:bg-green-500/5">
                      ₹{row.callLTP.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-850 dark:text-white bg-slate-50/30 dark:bg-slate-800/20">
                      {row.strike.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-650 dark:text-red-400 bg-red-50/5 dark:bg-red-500/5">
                      ₹{row.putLTP.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold bg-red-50/5 dark:bg-red-500/5 ${row.putChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {row.putChange >= 0 ? '+' : ''}{row.putChange}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 bg-red-50/5 dark:bg-red-500/5">
                      {(row.putOI / 1000).toFixed(1)}K
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Futures Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'NIFTY FUT Jun', price: 23425.50, change: 34.10, pct: 0.15 },
            { name: 'BANKNIFTY FUT Jun', price: 54520.00, change: -80.30, pct: -0.15 },
            { name: 'NIFTY FUT Jul', price: 23510.80, change: 42.60, pct: 0.18 },
          ].map((fut) => {
            const isPos = fut.pct >= 0;
            return (
              <div key={fut.name} className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-5 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">{fut.name}</p>
                <p className="text-lg font-extrabold font-mono text-slate-800 dark:text-white mt-1">
                  ₹{fut.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs font-bold mt-1.5 ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {isPos ? '+' : ''}{fut.change.toFixed(2)} ({isPos ? '+' : ''}{fut.pct.toFixed(2)}%)
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Determine which tab content to render
  const renderTabContent = () => {
    switch (activePrimaryTab) {
      case 'US Stocks':
        return renderUSStocks();
      case 'Mutual Funds':
        return renderMutualFunds();
      case 'F&O':
        return renderFnO();
      default:
        return renderIndianStocks();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Switch layout views based on activePrimaryTab */}
      {renderTabContent()}

      {/* Stock Detail Drawer overlay */}
      <AnimatePresence>
        {selectedSymbol && (
          <StockDetailDrawer
            symbol={selectedSymbol}
            onClose={() => setSelectedSymbol(null)}
          />
        )}
      </AnimatePresence>
      
    </motion.div>
  );
}
