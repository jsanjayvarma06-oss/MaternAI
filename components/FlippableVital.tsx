"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface FlippableVitalProps {
  title: string;
  value: string | number;
  unit: string;
  historyData: any[];
  dataKey: string;
  color: string;
  icon: string;
}

export function FlippableVital({ title, value, unit, historyData, dataKey, color, icon }: FlippableVitalProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ height: '140px', perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Glow dot */}
          <div
            className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {icon} {title}
          </p>
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-white leading-none">{value}</span>
              <span className="text-sm mb-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{unit}</span>
            </div>
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color }}>
              <TrendingUp size={10} /> Tap for 7-day trend
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl p-4 flex flex-col overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${color}33`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{title} — 7 Days</p>
          <div className="flex-1 w-full">
            {historyData && historyData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  More data after
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  a few check-ins
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
