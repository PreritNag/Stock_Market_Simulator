import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

export default function OrderBook({ symbol }) {
  const { orders } = useSelector((state) => state.portfolio);

  // Generate simulated order book depth from existing orders + generated data
  const { buyOrders, sellOrders } = useMemo(() => {
    const stockOrders = orders.filter((o) => o.symbol === symbol);

    const buys = stockOrders
      .filter((o) => o.type === 'BUY')
      .sort((a, b) => b.price - a.price)
      .slice(0, 8)
      .map((o) => ({
        price: Number(o.price),
        qty: Number(o.qty || o.quantity),
        total: Number(o.price) * Number(o.qty || o.quantity),
      }));

    const sells = stockOrders
      .filter((o) => o.type === 'SELL')
      .sort((a, b) => a.price - b.price)
      .slice(0, 8)
      .map((o) => ({
        price: Number(o.price),
        qty: Number(o.qty || o.quantity),
        total: Number(o.price) * Number(o.qty || o.quantity),
      }));

    return { buyOrders: buys, sellOrders: sells };
  }, [orders, symbol]);

  const maxBuyTotal = Math.max(...buyOrders.map((o) => o.total), 1);
  const maxSellTotal = Math.max(...sellOrders.map((o) => o.total), 1);

  const OrderRow = ({ order, type, maxTotal, index }) => {
    const barWidth = (order.total / maxTotal) * 100;
    const isBuy = type === 'BUY';

    return (
      <motion.div
        initial={{ opacity: 0, x: isBuy ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="relative group"
      >
        {/* Depth bar */}
        <div
          className={`absolute inset-0 rounded-md transition-all duration-300 ${
            isBuy ? 'bg-gain/8' : 'bg-loss/8'
          }`}
          style={{
            width: `${barWidth}%`,
            [isBuy ? 'right' : 'left']: 0,
          }}
        />
        <div className={`relative grid grid-cols-3 gap-2 py-1.5 px-2 text-xs font-mono ${
          isBuy ? 'text-right' : 'text-left'
        }`}>
          {isBuy ? (
            <>
              <span className="text-gray-400">{order.total.toFixed(0)}</span>
              <span className="text-gray-300">{order.qty}</span>
              <span className="text-gain font-medium">{order.price.toFixed(2)}</span>
            </>
          ) : (
            <>
              <span className="text-loss font-medium">{order.price.toFixed(2)}</span>
              <span className="text-gray-300">{order.qty}</span>
              <span className="text-gray-400">{order.total.toFixed(0)}</span>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Order Book</h3>
        <p className="text-xs text-gray-500 mt-0.5">{symbol} - Recent Orders</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/5">
        {/* Buy Side */}
        <div>
          <div className="grid grid-cols-3 gap-2 px-2 py-2 text-xs text-gray-500 font-medium text-right border-b border-white/5">
            <span>Total</span>
            <span>Qty</span>
            <span>Price (₹)</span>
          </div>
          <div className="p-1 max-h-64 overflow-y-auto">
            {buyOrders.length > 0 ? (
              buyOrders.map((order, idx) => (
                <OrderRow key={idx} order={order} type="BUY" maxTotal={maxBuyTotal} index={idx} />
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gray-500">No buy orders</div>
            )}
          </div>
        </div>

        {/* Sell Side */}
        <div>
          <div className="grid grid-cols-3 gap-2 px-2 py-2 text-xs text-gray-500 font-medium text-left border-b border-white/5">
            <span>Price (₹)</span>
            <span>Qty</span>
            <span>Total</span>
          </div>
          <div className="p-1 max-h-64 overflow-y-auto">
            {sellOrders.length > 0 ? (
              sellOrders.map((order, idx) => (
                <OrderRow key={idx} order={order} type="SELL" maxTotal={maxSellTotal} index={idx} />
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gray-500">No sell orders</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
