"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, Heart, ArrowLeft, Wind } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 4-7-8 breathing states
const BREATHING_STEPS = [
  { label: 'Breathe in', duration: 4, color: '#818CF8' },
  { label: 'Hold', duration: 7, color: '#FBBF24' },
  { label: 'Breathe out', duration: 8, color: '#34D399' },
];

function BreathingExercise() {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [countdown, setCountdown] = useState(BREATHING_STEPS[0].duration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const step = BREATHING_STEPS[stepIdx];

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setStepIdx(s => {
            const next = (s + 1) % BREATHING_STEPS.length;
            setCountdown(BREATHING_STEPS[next].duration);
            return next;
          });
          return BREATHING_STEPS[(stepIdx + 1) % BREATHING_STEPS.length].duration;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, stepIdx]);

  const stop = () => {
    setActive(false);
    setStepIdx(0);
    setCountdown(BREATHING_STEPS[0].duration);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="text-center py-6">
      <motion.div
        className="w-32 h-32 rounded-full mx-auto flex items-center justify-center border-4 mb-4"
        style={{ borderColor: step.color }}
        animate={{ scale: stepIdx === 0 ? [1, 1.3] : stepIdx === 2 ? [1.3, 1] : 1.3 }}
        transition={{ duration: step.duration, ease: 'easeInOut' }}
      >
        <div>
          <p className="text-2xl font-bold text-white">{countdown}</p>
          <p className="text-xs" style={{ color: step.color }}>{step.label}</p>
        </div>
      </motion.div>
      {!active ? (
        <button
          onClick={() => setActive(true)}
          className="px-6 py-3 rounded-2xl font-bold text-white bg-indigo-500 hover:bg-indigo-400 transition-colors"
        >
          <Wind size={16} className="inline mr-2" />Start 4-7-8 Breathing
        </button>
      ) : (
        <button onClick={stop} className="px-6 py-3 rounded-2xl font-bold text-white/60 border border-white/20 hover:bg-white/5 transition-colors">
          Stop
        </button>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  const router = useRouter();

  const supports = [
    {
      name: 'iCall India',
      phone: '9152987821',
      desc: 'Professional psychological counselling',
      hours: 'Mon–Sat, 8am–10pm',
      color: '#818CF8'
    },
    {
      name: 'Vandrevala Foundation',
      phone: '1860-2662-345',
      desc: '24/7 mental health helpline',
      hours: '24 hours, Hindi & English',
      color: '#F472B6'
    },
    {
      name: 'Fortis Stress Helpline',
      phone: '8376804102',
      desc: 'Fortis Healthcare mental health support',
      hours: 'Mon–Sat, 8am–8pm',
      color: '#34D399'
    },
  ];

  const selfHelp = [
    { emoji: '☀️', tip: 'Step outside for 10 minutes of sunlight — it genuinely lifts your mood.' },
    { emoji: '💧', tip: 'Drink a full glass of water right now. Dehydration amplifies low mood.' },
    { emoji: '👐', tip: 'Ask someone to hold the baby for 20 minutes while you rest with no tasks.' },
    { emoji: '🎵', tip: 'Play a song you love. Music directly affects your brain\'s emotional centre.' },
    { emoji: '📞', tip: 'Text one friend or family member right now — even a single emoji.' },
  ];

  const partnerRequests = [
    '"Can you take the baby for the next feeding so I can sleep?"',
    '"Can you cook or order food tonight so I don\'t have to think about it?"',
    '"Can you sit with me for 10 minutes without any tasks?"',
    '"Can you tell me I\'m doing a good job? I need to hear it."',
  ];

  const glass = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: 'radial-gradient(ellipse at top, #1a1030, #080012 60%)' }}
    >
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.12) 0%, transparent 100%)' }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 mb-6 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl font-bold text-white">You&apos;re Not Alone 💜</h1>
        <p className="text-white/50 text-sm mt-2 max-w-md">
          Many mothers feel exactly this way — overwhelmed, exhausted, unsure. What you&apos;re experiencing is common, real, and something you deserve help with.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-5 space-y-6">

        {/* Support helplines */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">Talk to someone</h2>
          <div className="space-y-3">
            {supports.map(s => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={glass}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: s.color + '22' }}
                >
                  <Phone size={16} style={{ color: s.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-xs text-white/40">{s.desc} · {s.hours}</p>
                </div>
                <a
                  href={`tel:${s.phone.replace(/-/g, '')}`}
                  className="px-3 py-2 rounded-xl font-bold text-xs text-white"
                  style={{ backgroundColor: s.color + '33', border: `1px solid ${s.color}44` }}
                >
                  Call
                </a>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Breathing exercise */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">Calm your nervous system</h2>
          <div className="rounded-3xl p-5" style={glass}>
            <p className="font-bold text-white mb-1">4-7-8 Breathing</p>
            <p className="text-xs text-white/40 mb-4">Scientifically proven to reduce anxiety in minutes. Used by midwives worldwide.</p>
            <BreathingExercise />
          </div>
        </section>

        {/* Self-help */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">5 things that actually help</h2>
          <div className="space-y-2">
            {selfHelp.map((item, i) => (
              <div key={i} className="rounded-2xl p-4 flex gap-3 items-start" style={glass}>
                <span className="text-xl">{item.emoji}</span>
                <p className="text-sm text-white/70 leading-relaxed">{item.tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partner requests */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">Ask your partner for this</h2>
          <div className="rounded-3xl p-5" style={glass}>
            <p className="text-xs text-white/40 mb-4">It can be hard to say what you need. Here are the words:</p>
            <div className="space-y-3">
              {partnerRequests.map((req, i) => (
                <p key={i} className="text-sm text-white/70 italic border-l-2 border-pink-400/40 pl-3">{req}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Normalize */}
        <section>
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-pink-400" />
              <p className="font-bold text-purple-300 text-sm">What&apos;s normal right now</p>
            </div>
            <ul className="space-y-2 text-xs text-white/60 leading-relaxed list-disc pl-4">
              <li>Crying without knowing why — perfectly normal hormonal response</li>
              <li>Feeling overwhelmed by a baby you deeply love — not a contradiction</li>
              <li>Wishing someone would take the baby for just one hour — completely okay</li>
              <li>Not feeling like yourself — your brain is literally rewiring right now</li>
              <li>Finding this harder than you expected — all mothers do, few say so</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
