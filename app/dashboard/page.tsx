"use client";

import React, { useEffect, useState } from 'react';
import { FlippableVital } from '@/components/FlippableVital';
import { DashboardCharts } from '@/components/DashboardCharts';
import { AlertBanner } from '@/components/AlertBanner';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, BrainCircuit, Activity, Sparkles, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/dashboard/${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();

        if (!json.has_todays_reading && (!json.history || json.history.length === 0)) {
          router.replace('/checkin');
          return;
        }

        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at top, #1a1030, #0a0010)' }}
      >
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Activity className="w-10 h-10 text-purple-400" />
        </motion.div>
        <p className="mt-4 text-white/50 text-sm font-medium">Loading your recovery data...</p>
      </div>
    );
  }

  if (!data || !data.history || data.history.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'radial-gradient(ellipse at top, #1a1030, #0a0010)' }}
      >
        <div className="text-5xl mb-4">🌸</div>
        <h2 className="text-2xl font-bold text-white mb-3">Welcome to MaternaAI</h2>
        <p className="mb-8 text-white/50 max-w-sm text-sm">Start your first daily check-in to begin monitoring your recovery journey.</p>
        <button
          onClick={() => router.push('/checkin')}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-600/30 active:scale-95 transition-transform"
        >
          Start First Check-in
        </button>
      </div>
    );
  }

  const { patient, latest_analysis, history } = data;

  const sparklineData = [...history].reverse().map((h: any) => ({
    systolic: h.vitals.systolic,
    diastolic: h.vitals.diastolic,
    hr: h.vitals.heart_rate,
    temp: h.vitals.temperature,
    spo2: h.vitals.spo2
  }));

  const currentVitals = history[0].vitals;
  const riskScores = latest_analysis?.risk_scores || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: 'radial-gradient(ellipse at top, #1a1030, #080012 60%)' }}
    >
      {/* Header */}
      <div className="relative overflow-hidden px-4 pt-12 pb-8"
        style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, transparent 100%)' }}
      >
        <div className="max-w-4xl mx-auto flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-1 flex items-center gap-1.5">
              <Sparkles size={10} /> MaternaAI
            </p>
            <h1 className="text-3xl font-bold text-white">
              Hello, {patient.name.split(' ')[0]} 👋
            </h1>
            <p className="text-white/40 text-sm mt-1">Day {Math.max(0, history[0].day_post_delivery)} Postpartum</p>
          </div>
          <button
            onClick={() => { auth.signOut(); router.push('/login'); }}
            className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 space-y-5"
      >
        {/* Alert Banner */}
        {latest_analysis && (
          <motion.div variants={itemVariants}>
            <AlertBanner level={latest_analysis.alert_level} message={latest_analysis.patient_message} />
          </motion.div>
        )}

        {/* Vitals Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FlippableVital title="Blood Pressure" value={`${currentVitals.systolic}/${currentVitals.diastolic}`} unit="mmHg" historyData={sparklineData} dataKey="systolic" color="#818CF8" icon="💜" />
          <FlippableVital title="Heart Rate" value={currentVitals.heart_rate} unit="bpm" historyData={sparklineData} dataKey="hr" color="#F472B6" icon="❤️" />
          <FlippableVital title="Temperature" value={currentVitals.temperature} unit="°C" historyData={sparklineData} dataKey="temp" color="#FBBF24" icon="🌡️" />
          <FlippableVital title="Oxygen SpO2" value={currentVitals.spo2} unit="%" historyData={sparklineData} dataKey="spo2" color="#34D399" icon="💨" />
        </motion.div>

        {/* Recharts */}
        <motion.div variants={itemVariants}>
          <DashboardCharts history={history} />
        </motion.div>

        {/* Risk + AI Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Risk Scores */}
          <div
            className="rounded-3xl p-5 flex flex-col gap-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" /> Risk Snapshot
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Preeclampsia', value: riskScores.preeclampsia, color: '#818CF8' },
                { label: 'Hemorrhage', value: riskScores.hemorrhage, color: '#F87171' },
                { label: 'Blood Clot', value: riskScores.blood_clot, color: '#F472B6' },
                { label: 'Infection', value: riskScores.wound_infection, color: '#FBBF24' },
                { label: 'PPD Risk', value: riskScores.ppd, color: '#34D399' },
              ].map(risk => (
                <div key={risk.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs font-medium text-white/50 shrink-0">{risk.label}</div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: risk.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${risk.value || 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="w-8 text-right text-xs font-bold" style={{ color: risk.color }}>
                    {risk.value || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div
            className="rounded-3xl p-5 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
              border: '1px solid rgba(139,92,246,0.2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-4">
              <BrainCircuit className="w-4 h-4" /> Gemini AI Insights
            </h3>
            <div className="flex-1 space-y-3">
              {latest_analysis?.insights && latest_analysis.insights.length > 0 ? (
                latest_analysis.insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</span>
                    <p className="text-xs text-white/60 leading-relaxed">{insight}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40 italic">Trend analysis will improve after more check-ins.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400/60 mb-1">Recommended Action</p>
              <p className="text-sm font-medium text-white/80">
                {latest_analysis?.recommended_action || 'Continue resting and stay hydrated.'}
              </p>
            </div>
          </div>

        </motion.div>

        {/* Check-in CTA */}
        {!data.has_todays_reading && (
          <motion.div variants={itemVariants}>
            <button
              onClick={() => router.push('/checkin')}
              className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-purple-600/30 active:scale-95 transition-transform"
            >
              ✦ Start Today&apos;s Check-in
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
