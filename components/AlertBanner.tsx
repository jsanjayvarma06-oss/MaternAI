"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, PhoneCall, Sparkles } from 'lucide-react';

interface AlertBannerProps {
  level: "GREEN" | "YELLOW" | "RED";
  message: string;
  doctorNotified?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ level, message, doctorNotified }) => {
  const config = {
    GREEN: {
      gradient: 'from-emerald-500/15 to-teal-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
      glow: '#10B981',
      label: 'All Good'
    },
    YELLOW: {
      gradient: 'from-amber-500/15 to-orange-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      icon: <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
      glow: '#F59E0B',
      label: 'Monitor'
    },
    RED: {
      gradient: 'from-red-600/20 to-rose-500/10',
      border: 'border-red-500/40',
      text: 'text-red-300',
      icon: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
      glow: '#EF4444',
      label: 'Alert'
    }
  };

  const style = config[level];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border p-4 flex items-start gap-3 bg-gradient-to-r overflow-hidden ${style.gradient} ${style.border}`}
    >
      {/* Subtle animated glow */}
      {level === 'RED' && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: `radial-gradient(circle at 50% 50%, ${style.glow}22, transparent 70%)` }}
        />
      )}
      
      <div className="flex-1 flex items-start gap-3">
        {style.icon}
        <div>
          <p className={`text-sm font-semibold ${style.text}`}>{message}</p>
          {(level === "RED" || doctorNotified) && (
            <p className="text-xs mt-1 text-red-400 font-medium">
              ✓ Your doctor has been notified
            </p>
          )}
        </div>
      </div>

      {level === "RED" && (
        <a
          href="tel:108"
          className="shrink-0 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95"
        >
          <PhoneCall size={13} /> SOS 108
        </a>
      )}
    </motion.div>
  );
};
