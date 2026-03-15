import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface RiskScores {
  preeclampsia: number;
  hemorrhage: number;
  blood_clot: number;
  wound_infection: number;
}

interface RiskScoreCardProps {
  scores: RiskScores;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ scores }) => {
  const getProgressBarColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 30) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const scoreItems = [
    { label: "Preeclampsia", score: scores.preeclampsia },
    { label: "Postpartum Hemorrhage", score: scores.hemorrhage },
    { label: "Blood Clot", score: scores.blood_clot },
    { label: "Wound Infection", score: scores.wound_infection },
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <ShieldAlert className="text-indigo-500" /> Condition Analytics
      </h3>

      <div className="space-y-5">
        {scoreItems.map((item, idx) => (
          <div key={idx} className="relative">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {item.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden flex">
              <div
                className={`h-2.5 rounded-full ${getProgressBarColor(item.score)} transition-all duration-1000 ease-out`}
                style={{ width: `${item.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
