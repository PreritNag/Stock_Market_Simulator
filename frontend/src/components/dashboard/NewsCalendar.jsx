import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiCalendar, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';

const MARKET_NEWS = [
  {
    id: 1,
    title: 'RBI leaves repo rate unchanged at 6.50% in monetary policy committee',
    source: 'Moneycontrol',
    time: '2 hours ago',
    category: 'Macro',
    impact: 'HIGH',
  },
  {
    id: 2,
    title: 'TCS signs $450M multi-year digital transformation deal with European retail giant',
    source: 'Economic Times',
    time: '4 hours ago',
    category: 'TCS',
    impact: 'HIGH',
  },
  {
    id: 3,
    title: 'Reliance Industries partners with global chip maker for domestic AI data centers',
    source: 'Mint',
    time: '6 hours ago',
    category: 'RELIANCE',
    impact: 'HIGH',
  },
  {
    id: 4,
    title: 'Gold prices hit all-time high amid global economic uncertainties and interest rate speculation',
    source: 'Bloomberg',
    time: '8 hours ago',
    category: 'GOLDBEES',
    impact: 'MEDIUM',
  },
  {
    id: 5,
    title: 'Ethereum developers confirm dates for the upcoming network scaling upgrade',
    source: 'CoinDesk',
    time: '12 hours ago',
    category: 'ETHINR',
    impact: 'MEDIUM',
  }
];

const CALENDAR_EVENTS = [
  {
    id: 1,
    time: '05:30 PM',
    event: 'India Inflation Rate (YoY)',
    actual: '4.85%',
    forecast: '5.10%',
    previous: '5.09%',
    impact: 'HIGH',
    trend: 'down'
  },
  {
    id: 2,
    time: '06:00 PM',
    event: 'US Interest Rate Decision',
    actual: '5.25%',
    forecast: '5.25%',
    previous: '5.50%',
    impact: 'HIGH',
    trend: 'neutral'
  },
  {
    id: 3,
    time: '07:15 PM',
    event: 'Eurozone GDP (YoY) Q1',
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.1%',
    impact: 'MEDIUM',
    trend: 'up'
  },
  {
    id: 4,
    time: '08:30 PM',
    event: 'US Unemployment Rate',
    actual: '3.9%',
    forecast: '3.8%',
    previous: '3.8%',
    impact: 'HIGH',
    trend: 'up'
  }
];

export default function NewsCalendar() {
  const [activeTab, setActiveTab] = useState('news'); // 'news' | 'calendar'

  return (
    <div className="glass-card overflow-hidden flex flex-col h-[480px]">
      {/* Toggles */}
      <div className="flex border-b border-white/5 bg-white/2">
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'news'
              ? 'border-primary-500 text-white bg-primary-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FiGlobe size={14} /> Market News
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
            activeTab === 'calendar'
              ? 'border-primary-500 text-white bg-primary-500/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FiCalendar size={14} /> Economic Calendar
        </button>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'news' ? (
            <motion.div
              key="news"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {MARKET_NEWS.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-2 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-primary-400 uppercase bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/10">
                      {item.category}
                    </span>
                    <span className="text-gray-500">{item.time}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-snug">{item.title}</h4>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Source: <span className="text-gray-400 font-medium">{item.source}</span></span>
                    <span className={`font-bold uppercase ${
                      item.impact === 'HIGH' ? 'text-loss' : 'text-amber-500'
                    }`}>
                      {item.impact} Impact
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase px-1 pb-1">
                <span>Event / Time</span>
                <div className="flex gap-4">
                  <span className="w-12 text-right">Actual</span>
                  <span className="w-12 text-right">Forecast</span>
                  <span className="w-12 text-right">Prev</span>
                </div>
              </div>

              {CALENDAR_EVENTS.map((event) => (
                <div key={event.id} className="p-3 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">{event.event}</p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-500 font-mono">{event.time}</span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] uppercase ${
                        event.impact === 'HIGH' ? 'bg-loss/10 text-loss' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {event.impact}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 font-mono text-xs font-semibold">
                    <span className={`w-12 text-right flex items-center justify-end gap-1 ${
                      event.trend === 'up' ? 'text-gain' : event.trend === 'down' ? 'text-loss' : 'text-gray-300'
                    }`}>
                      {event.actual}
                      {event.trend === 'up' && <FiTrendingUp size={10} />}
                      {event.trend === 'down' && <FiTrendingDown size={10} />}
                    </span>
                    <span className="w-12 text-right text-gray-400">{event.forecast}</span>
                    <span className="w-12 text-right text-gray-500">{event.previous}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
