import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

export const WeightChart = ({
  logs,
  targetWeight,
  unit = 'kg',
}) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No weight logs yet. Log your first check-in to see your progress curve.
      </div>
    );
  }

  const data = logs.map((log) => {
    const raw = log.date || '';
    const [, month, day] = raw.split('-');
    return {
      date: `${month}/${day}`,
      rawDate: raw,
      weight: log.weight_kg ?? log.weightKg,
      bodyFat: log.body_fat_percentage ?? log.bodyFatPercentage,
    };
  });

  const weights = logs.map((l) => Number(l.weight_kg ?? l.weightKg));
  if (targetWeight) weights.push(Number(targetWeight));
  const minWeight = Math.floor(Math.min(...weights) - 2);
  const maxWeight = Math.ceil(Math.max(...weights) + 2);

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3144" vertical={false} opacity={0.4} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#2a3144' }}
          />
          <YAxis
            domain={[minWeight, maxWeight]}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#2a3144' }}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-dark-900 border border-white/10 p-2.5 rounded-xl shadow-xl text-left">
                    <p className="text-[10px] text-slate-400 font-semibold">{item.rawDate}</p>
                    <p className="text-sm font-black text-lime">
                      {item.weight} <span className="text-[10px] text-slate-300 font-normal">{unit}</span>
                    </p>
                    {item.bodyFat && (
                      <p className="text-xs text-amber-400 font-medium">
                        Body Fat: {item.bodyFat}%
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          {targetWeight && (
            <ReferenceLine
              y={targetWeight}
              stroke="#38bdf8"
              strokeDasharray="4 4"
              label={{
                value: `Goal: ${targetWeight}${unit}`,
                fill: '#38bdf8',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#bbf43d"
            strokeWidth={3}
            dot={{ r: 4, fill: '#bbf43d', strokeWidth: 2, stroke: '#090a0f' }}
            activeDot={{ r: 6, fill: '#ccff00', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
