'use client';

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TRANSPORT_ROWS } from './transportRows';

const COLORS = ['#f2b45a', '#e8c98f', '#9fd8e8', '#b8f36b', '#b8f36b'];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: '#f1f3ea',
        color: '#0a1712',
        fontSize: 13,
        lineHeight: 1.4,
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
      }}
    >
      <strong>{row.mode}</strong>
      <br />≈ {row.value} г CO₂ на пассажиро-км
      <br />
      <span style={{ color: '#4b5b51' }}>{row.note}</span>
    </div>
  );
}

export default function TransportChart({ compact = false }) {
  return (
    <div style={{ width: '100%', height: compact ? 280 : 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={TRANSPORT_ROWS}
          layout="vertical"
          margin={{ top: 4, right: compact ? 44 : 56, bottom: 18, left: compact ? 0 : 8 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(220,245,225,0.1)" />
          <XAxis
            type="number"
            domain={[0, 280]}
            tick={{ fill: '#9ba99f', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(220,245,225,0.24)' }}
            tickLine={false}
            label={{ value: 'г CO₂ на пассажиро-км', position: 'insideBottomRight', offset: -12, fill: '#9ba99f', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="mode"
            width={compact ? 118 : 170}
            tick={{ fill: '#f1f3ea', fontSize: compact ? 11 : 13 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(220,245,225,0.05)' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive animationDuration={900}>
            {TRANSPORT_ROWS.map((row, i) => (
              <Cell key={row.mode} fill={COLORS[i]} />
            ))}
            <LabelList dataKey="value" position="right" fill="#f1f3ea" fontSize={13} formatter={(v) => (v === 0 ? '0' : `≈ ${v}`)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
