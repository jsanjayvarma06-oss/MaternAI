"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Footprints, Heart, Calendar, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

interface WellbeingSectionProps {
  wellbeingData: any;   // latest wellbeing log
  trend: any;           // { sleep_trend, mood_trend, activity_trend }
  latestAnalysis: any;  // from main dashboard data
  dayPostDelivery: number;
}

// ── Mood dot color
function moodColor(score: number): string {
  if (score >= 4) return '#34D399';
  if (score === 3) return '#FBBF24';
  return '#F87171';
}

// ── Animated count-up number (Task 9 — sleep count-up)
function CountUp({ to, decimals = 1 }: { to: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 40;
    const increment = to / steps;
    let current = 0;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      current = Math.min(current + increment, to);
      setVal(parseFloat(current.toFixed(decimals)));
      if (i >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [to, decimals]);
  return <>{val.toFixed(decimals)}</>;
}

export function WellbeingSection({
  wellbeingData,
  trend,
  latestAnalysis,
  dayPostDelivery,
}: WellbeingSectionProps) {
  const router = useRouter();
  const milestoneShownKey = `milestone_shown_day_${dayPostDelivery}`;
  const [showMilestone, setShowMilestone] = useState(false);
  const [ppd_banner_shown] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`ppd_banner_${today}`) === 'true';
  });

  const milestoneReached: string | null = latestAnalysis?.milestone_reached ?? null;
  const ppd_risk = latestAnalysis?.ppd_risk_flag === true;
  const weekContext: string = latestAnalysis?.week_context ?? '';
  const scores = latestAnalysis?.wellbeing_scores ?? wellbeingData?.scores ?? {};

  const sleepHours: number = wellbeingData?.sleep?.total_hours ?? 0;
  const sleepQuality: number = wellbeingData?.sleep?.sleep_quality ?? 3;
  const walkedToday: boolean = wellbeingData?.activity?.walked_today ?? false;
  const walkMins: number | null = wellbeingData?.activity?.walk_duration_minutes ?? null;

  const moodTrend: number[] = trend?.mood_trend ?? [];
  const sleepScore: number = scores?.sleep_score ?? 0;
  const activityScore: number = scores?.activity_score ?? 0;
  const hormonalScore: number = scores?.hormonal_score ?? 0;

  // Show milestone banner (only once per day_post_delivery)
  const confettiFired = useRef(false);
  useEffect(() => {
    if (!milestoneReached) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(milestoneShownKey) === 'true') return;
    setShowMilestone(true);
    if (!confettiFired.current) {
      confettiFired.current = true;
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
      }, 300);
    }
    const timer = setTimeout(() => {
      setShowMilestone(false);
      localStorage.setItem(milestoneShownKey, 'true');
    }, 8000);
    return () => clearTimeout(timer);
  }, [milestoneReached, milestoneShownKey]);

  // PPD support shown at most once per day
  const showPPD = ppd_risk && !ppd_banner_shown;
  useEffect(() => {
    if (showPPD && typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`ppd_banner_${today}`, 'true');
    }
  }, [showPPD]);

  // Sleep message
  function sleepMessage() {
    if (sleepScore < 30) return "Getting some rest — keep going";
    if (sleepScore < 60) return "Sleep is fragmented — nap when you can";
    return "Severely sleep deprived — ask for help tonight";
  }

  // Activity message
  function activityMessage() {
    if (dayPostDelivery <= 7) return "Rest is your activity right now";
    if (dayPostDelivery <= 21) return "Short gentle walks are perfect";
    return "Building strength slowly";
  }

  // Mood message (no numbers, no clinical terms)
  function moodMessage() {
    if (hormonalScore < 30) return "Your mood is holding steady";
    if (hormonalScore < 60) return "Tough days happen — be gentle with yourself";
    return "You deserve extra support right now";
  }

  const glass = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest px-1">Your Wellbeing Today</h2>

      {/* ── Milestone Banner (Task 9) */}
      <AnimatePresence>
        {showMilestone && milestoneReached && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="rounded-3xl p-5 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
              border: '1px solid rgba(251,191,36,0.3)',
            }}
          >
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-amber-300 text-base">{milestoneReached}</p>
            <p className="text-xs text-white/50 mt-1">You are incredible.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Week Context Card (Task 9) */}
      {weekContext && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex gap-3 items-start"
          style={{
            background: 'rgba(232,146,124,0.08)',
            borderLeft: '3px solid #E8927C',
          }}
        >
          <Calendar size={16} className="text-[#E8927C] shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">{weekContext}</p>
        </motion.div>
      )}

      {/* ── Three wellbeing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Sleep Card (Task 9 — count-up) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl p-5"
          style={glass}
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon size={16} className="text-purple-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Sleep</p>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-3xl font-bold text-white">
              {sleepHours > 0 ? <CountUp to={sleepHours} /> : '—'}
            </span>
            <span className="text-sm text-white/40 mb-0.5">hrs</span>
          </div>
          {/* Quality stars */}
          <div className="flex gap-0.5 mb-3">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-sm ${s <= sleepQuality ? 'text-amber-400' : 'text-white/15'}`}>★</span>
            ))}
          </div>
          <p className="text-xs text-white/50">{sleepMessage()}</p>
        </motion.div>

        {/* Activity Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-5"
          style={glass}
        >
          <div className="flex items-center gap-2 mb-3">
            <Footprints size={16} className="text-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Activity</p>
          </div>
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${walkedToday ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}
            >
              {walkedToday ? '✓ Walked today' : '— No walk today'}
            </span>
            {walkedToday && walkMins && (
              <p className="text-xs text-white/40 mt-1 pl-1">{walkMins} minutes</p>
            )}
          </div>
          <p className="text-xs text-white/50">{activityMessage()}</p>
        </motion.div>

        {/* Mood Card (Task 10: no numbers, no clinical terms) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl p-5"
          style={glass}
        >
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-pink-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Mood</p>
          </div>
          {/* 7 mood dots — fade in with 0.1s stagger (Task 9) */}
          <div className="flex gap-1.5 mb-3">
            {moodTrend.length > 0 ? moodTrend.map((score, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: moodColor(score) }}
                title={`Day ${i + 1}`}
              />
            )) : (
              <p className="text-xs text-white/30 italic">More data after check-ins</p>
            )}
          </div>
          <p className="text-xs text-white/50">{moodMessage()}</p>
        </motion.div>

      </div>

      {/* ── PPD support banner (Task 9: gentle fade, amber only, never red, max once/day) */}
      <AnimatePresence>
        {showPPD && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <p className="text-sm font-semibold text-amber-300 mb-1">
              We notice you&apos;ve been having a difficult time lately.
            </p>
            <p className="text-xs text-white/50 mb-3">
              You&apos;re not alone — many mothers feel this way, and extra support is always available.
            </p>
            <button
              onClick={() => router.push('/resources')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-amber-300 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
            >
              Find support →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
