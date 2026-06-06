import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

/**
 * Visualizes profit/loss comparison across holdings using Recharts
 * @param {Array} holdings - Array of user holdings 
 */
export default function PnLBarChart({ holdings = [] }) {
  const data = holdings.map((h) => ({
    name: h.symbol,
    pnl: Number(h.unrealizedPnL || 0),
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No P&L data to display
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#121622',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Unrealized P&L']}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              const color = entry.pnl >= 0 ? '#00d09c' : '#eb5b5b';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
