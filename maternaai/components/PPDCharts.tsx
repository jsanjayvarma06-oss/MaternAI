"use client";

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import { AlertTriangle, Moon, Users, MessageSquare } from 'lucide-react';

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

export function PPDCharts({ ppdHistory }: { ppdHistory: any[] }) {
  const chartData = [...ppdHistory].reverse().map(p => ({
    date: new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: p.total_epds_score || 0,
    risk: p.risk_level
  }));

  const latest = ppdHistory[0] || {};
  const signals = latest.passive_signals || {};

  return (
    <div className="space-y-6">
      {/* EPDS Timeline */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 font-display flex items-center gap-2">
            EPDS Score Timeline
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
              <YAxis domain={[0, 30]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
              
              <ReferenceLine y={9} stroke="#FBBF24" strokeDasharray="5 5" label={{ value: 'Moderate', position: 'insideTopLeft', fill: '#FBBF24', fontSize: 10 }} />
              <ReferenceLine y={12} stroke="#F87171" strokeDasharray="5 5" label={{ value: 'High', position: 'insideTopLeft', fill: '#F87171', fontSize: 10 }} />
              <ReferenceLine y={15} stroke="#B91C1C" strokeDasharray="5 5" label={{ value: 'Crisis', position: 'insideTopLeft', fill: '#B91C1C', fontSize: 10 }} />
              
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#EC4899" 
                strokeWidth={3} 
                dot={({ cx, cy, payload }) => (
                  <circle 
                    cx={cx} cy={cy} r={6} 
                    fill={payload.score >= 15 ? '#B91C1C' : payload.score >= 12 ? '#F87171' : payload.score >= 9 ? '#FBBF24' : '#EC4899'} 
                    stroke="white" strokeWidth={2} 
                  />
                )} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Passive Signal Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4">
          <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Behavioral Flags
          </h4>
          <div className="space-y-2">
            <SignalItem label="Consecutive Low Mood" value={`${signals.consecutive_low_mood || 0} days`} alert={signals.consecutive_low_mood >= 3} />
            <SignalItem label="Social Withdrawal" value={signals.social_withdrawal ? "Detected" : "None"} alert={signals.social_withdrawal} />
            <SignalItem label="Sleep Anxiety Pattern" value={signals.sleep_anxiety_pattern ? "Yes" : "No"} alert={signals.sleep_anxiety_pattern} />
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4" /> Conversation Insights
          </h4>
          <div className="space-y-2">
            <SignalItem label="Avg Response Length" value={`${signals.response_length_avg || 0} words`} alert={signals.response_length_avg < 5} />
            <SignalItem label="Skipped Check-ins" value={`${signals.skipped_days || 0} days`} alert={signals.skipped_days > 2} />
            <SignalItem label="Night Activity (12-4am)" value={`${signals.night_message_count || 0}`} alert={signals.night_message_count > 2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalItem({ label, value, alert }: { label: string, value: string, alert?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={`font-bold ${alert ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}
