import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

/**
 * Renders portfolio asset allocation using Recharts
 * @param {Array} holdings - Array of user holdings 
 */
export default function PortfolioPieChart({ holdings = [] }) {
  const data = holdings.map((h) => ({
    name: h.symbol,
    value: Number((h.qty * (h.currentPrice || h.avgPrice)).toFixed(2)),
  })).filter((item) => item.value > 0);

  const COLORS = ['#00d09c', '#3b82f6', '#8b5cf6', '#ff9f00', '#f43f5e', '#06b6d4', '#ec4899'];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No asset holdings to display
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#121622',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Allocation']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-gray-400 font-semibold">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
