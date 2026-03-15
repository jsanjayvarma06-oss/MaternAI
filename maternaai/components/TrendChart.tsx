"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VitalsReading {
  systolic: number;
  diastolic: number;
  heart_rate: number;
  temperature: number;
  timestamp: string;
}

interface TrendChartProps {
  data: VitalsReading[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  // Format the dates for display
  const chartData = data.map(d => {
    const date = new Date(d.timestamp);
    return {
      ...d,
      displayDate: `${date.getDate()} ${date.toLocaleString('en', { month: 'short' })}`,
    };
  });

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm w-full h-[350px]">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
        7-Day Vitals Trend
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
          <YAxis yAxisId="bp" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
          <YAxis yAxisId="hr" orientation="right" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={10} />
          
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          
          <Line yAxisId="bp" type="monotone" dataKey="systolic" name="Systolic BP" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line yAxisId="bp" type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line yAxisId="hr" type="monotone" dataKey="heart_rate" name="Heart Rate" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
