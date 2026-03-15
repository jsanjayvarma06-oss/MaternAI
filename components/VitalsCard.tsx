import React from 'react';
import { HeartPulse, Thermometer, Activity, Droplet } from 'lucide-react';

interface VitalsCardProps {
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  spo2: number;
  weight: number;
  trend?: "up" | "down" | "stable";
}

const getStatusColor = (val: number, type: string) => {
  if (type === "bp") return val > 140 ? "text-red-500" : "text-emerald-500";
  if (type === "hr") return val > 100 ? "text-amber-500" : "text-emerald-500";
  if (type === "temp") return val > 38 ? "text-red-500" : "text-emerald-500";
  if (type === "spo2") return val < 94 ? "text-red-500" : "text-emerald-500";
  return "text-gray-700 dark:text-gray-300";
};

export const VitalsCard: React.FC<VitalsCardProps> = ({ systolic, diastolic, heartRate, temperature, spo2, weight }) => {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Activity className="text-blue-500" /> Current Vitals
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <HeartPulse size={16} /> Blood Pressure
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(systolic, "bp")}`}>
            {systolic}/{diastolic} <span className="text-sm font-normal text-gray-400">mmHg</span>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Activity size={16} /> Heart Rate
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(heartRate, "hr")}`}>
            {heartRate} <span className="text-sm font-normal text-gray-400">bpm</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Thermometer size={16} /> Temperature
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(temperature, "temp")}`}>
            {temperature.toFixed(1)} <span className="text-sm font-normal text-gray-400">°C</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="flex flex-col p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Droplet size={16} /> Blood Oxygen
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(spo2, "spo2")}`}>
            {spo2} <span className="text-sm font-normal text-gray-400">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
