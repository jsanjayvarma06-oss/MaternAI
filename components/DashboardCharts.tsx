"use client";

import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, ReferenceLine, BarChart, Bar, Legend } from 'recharts';

const DARK_GRID = 'rgba(255,255,255,0.06)';
const DARK_TICK = 'rgba(255,255,255,0.3)';
const TOOLTIP_STYLE = {
  borderRadius: '14px',
  backgroundColor: 'rgba(20, 10, 40, 0.95)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  color: '#fff',
  backdropFilter: 'blur(20px)',
};

export function DashboardCharts({ history }: { history: any[] }) {
  const [activeTab, setActiveTab] = useState<'bp' | 'hr' | 'score'>('bp');

  const chartData = [...history].reverse().map(h => ({
    date: new Date(h.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
    systolic: h.vitals?.systolic || 0,
    diastolic: h.vitals?.diastolic || 0,
    hr: h.vitals?.heart_rate || 0,
    temp: h.vitals?.temperature || 0,
    pain: h.symptoms?.pain_level || 0,
    mood: h.symptoms?.mood_score || 0,
  }));

  const tabs = [
    { key: 'bp', label: 'BP', color: '#818CF8' },
    { key: 'hr', label: 'HR', color: '#F472B6' },
    { key: 'score', label: 'Score', color: '#FBBF24' },
  ] as const;

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-white">7-Day Trends</h3>
        <div
          className="flex p-1 rounded-xl gap-1"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={
                activeTab === tab.key
                  ? { background: tab.color + '22', color: tab.color, border: `1px solid ${tab.color}44` }
                  : { color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'bp' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={DARK_GRID} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: DARK_TICK }} dy={10} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: DARK_TICK }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px', color: DARK_TICK }} />
              <ReferenceLine y={140} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '140 danger', fill: '#EF444466', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={90} stroke="#EF4444" strokeDasharray="3 3" label={{ value: '90 danger', fill: '#EF444466', fontSize: 9, position: 'right' }} />
              <Line name="Systolic" type="monotone" dataKey="systolic" stroke="#818CF8" strokeWidth={2.5} dot={{ r: 3, fill: '#818CF8' }} activeDot={{ r: 5 }} />
              <Line name="Diastolic" type="monotone" dataKey="diastolic" stroke="#C4B5FD" strokeWidth={2.5} dot={{ r: 3, fill: '#C4B5FD' }} opacity={0.8} />
            </LineChart>
          ) : activeTab === 'hr' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F472B6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={DARK_GRID} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: DARK_TICK }} dy={10} />
              <YAxis domain={[50, 150]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: DARK_TICK }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Elevated', fill: '#EF444466', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="hr" name="Heart Rate" stroke="#F472B6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHr)" />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={DARK_GRID} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: DARK_TICK }} dy={10} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: DARK_TICK }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px', color: DARK_TICK }} />
              <Bar dataKey="mood" name="Mood Score" fill="#FBBF24" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="pain" name="Pain Level" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={36} opacity={0.8} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
