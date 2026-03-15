import React from 'react';
import { AlertTriangle, CheckCircle, Info, PhoneCall } from 'lucide-react';

interface AlertBannerProps {
  level: "GREEN" | "YELLOW" | "RED";
  message: string;
  doctorNotified?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ level, message, doctorNotified }) => {
  const config = {
    GREEN: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-300",
      icon: <CheckCircle className="text-emerald-500 w-6 h-6" />,
      pulse: false
    },
    YELLOW: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      icon: <Info className="text-amber-500 w-6 h-6" />,
      pulse: false
    },
    RED: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-500 dark:border-red-500",
      text: "text-red-900 dark:text-red-300",
      icon: <AlertTriangle className="text-red-600 w-6 h-6" />,
      pulse: true
    }
  };

  const style = config[level];

  return (
    <div className={`rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center gap-4 transition-all ${style.bg} ${style.border} ${style.pulse ? 'animate-pulse' : ''}`}>
      <div className="shrink-0 mt-1 md:mt-0">
        {style.icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${style.text}`}>{message}</p>
        {(level === "RED" || doctorNotified) && (
          <p className="text-sm mt-1 font-semibold text-red-600 dark:text-red-400">
            ✓ Your doctor has been notified securely.
          </p>
        )}
      </div>
      
      {level === "RED" && (
        <a 
          href="tel:108" 
          className="shrink-0 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-transform active:scale-95"
        >
          <PhoneCall size={18} /> Emergency SOS (108)
        </a>
      )}
    </div>
  );
};
