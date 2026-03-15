"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Camera, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CheckInSuccess from '@/components/animations/CheckInSuccess';
import { auth } from '@/lib/firebase';
import confetti from 'canvas-confetti';

import PPDChat from '@/components/PPDChat';

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
};

export default function CheckinPage() {
  const router = useRouter();
  const [[step, direction], setPage] = useState([1, 0]);
  const [showFullChat, setShowFullChat] = useState(false);

  // FIX 2: Check if user already checked in today on page load → redirect to dashboard
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        // Check checkin status
        const res = await fetch(`http://localhost:8000/users/status/${user.uid}`);
        if (res.ok) {
          const { has_checked_in_today } = await res.json();
          if (has_checked_in_today) {
            router.replace('/dashboard');
            return;
          }
        }

        // Frequency Logic: Should show full PPD chat?
        const ppdRes = await fetch(`/api/ppd?patientId=${user.uid}`);
        if (ppdRes.ok) {
          const { show_full_chat } = await ppdRes.json();
          setShowFullChat(show_full_chat);
        }
      } catch (e) {
        console.error('Status check failed', e);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Unified State
  const [vitals, setVitals] = useState({
    systolic: 120, diastolic: 80, heart_rate: 75, temperature: 37.0, spo2: 98, weight_kg: 65
  });
  const [symptoms, setSymptoms] = useState({
    headache: false, visual_disturbance: false, leg_swelling: false,
    shortness_of_breath: false, heavy_bleeding: false, nausea: false, extreme_fatigue: false,
    pain_level: 0, bleeding_level: 'none', mood_score: 5
  });
  const [wound, setWound] = useState({ applicable: false, photo_score: null as string | null });
  // Engine 4 — Wellbeing state
  const [wellbeing, setWellbeing] = useState({
    sleep: { total_hours: 5, longest_stretch_hours: 2, night_wakings: 2, sleep_quality: 3, nap_taken: false, nap_duration_minutes: null as number | null },
    activity: { walked_today: false, walk_duration_minutes: null as number | null, exercise_attempted: false, exercise_type: null as string | null, felt_too_tired_to_move: false, steps_count: null as number | null },
    hormonal: { mood_score: 3, crying_spells: false, felt_overwhelmed: false, felt_bonded_with_baby: true, anxiety_level: 2, support_received_today: true }
  });
  // FIX 6: loading state to prevent double-submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const nextStep = (stepNumber: number) => {
    setPage([stepNumber, 1]);
  };

  const closeSheet = () => {
    router.push('/dashboard');
  };

  // FIX 1 + 4: Check response before redirecting; redirect to /dashboard on success
  // Engine 4: After saving reading, also POST wellbeing data
  const submitCheckin = async (finalMood: number) => {
    setLoading(true);
    setError('');
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    const payload = {
      patient_id: user.uid,
      vitals,
      symptoms: { ...symptoms, mood_score: finalMood },
      wound
    };

    try {
      const res = await fetch("http://localhost:8000/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError('Failed to save your check-in. Please try again.');
        setLoading(false);
        return;
      }

      setAnalysisResult(data.analysis);

      // Engine 4: save wellbeing log (non-blocking — don't fail check-in if this fails)
      try {
        await fetch("http://localhost:8000/wellbeing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: user.uid,
            ...wellbeing
          })
        });
      } catch (wb_err) {
        console.warn('Wellbeing save failed (non-critical):', wb_err);
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      nextStep(7);

    } catch (e) {
      console.error(e);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col font-body">
      <div className="pt-12 pb-4 px-6 flex flex-col items-center relative">
        <button onClick={closeSheet} className="absolute left-6 top-12 p-2 rounded-full hover:bg-surface active:scale-95 transition-transform"><X className="w-6 h-6 text-text-secondary" /></button>
        <div className="flex gap-2 items-center justify-center w-full mt-2">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <motion.div
              key={s}
              className={`flex items-center justify-center rounded-full transition-colors duration-300 ${s === step ? "bg-primary w-10 h-3" : s < step ? "bg-success w-6 h-3" : "bg-text-muted/30 w-3 h-3"}`}
              animate={{ width: s === step ? 40 : (s < step ? 24 : 12) }}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            className="absolute inset-0 w-full h-full overflow-y-auto pb-24 px-6 hide-scrollbar"
          >
            {step === 1 && <Step1Vitals vitals={vitals} setVitals={setVitals} onNext={() => nextStep(2)} />}
            {step === 2 && <Step2Symptoms symptoms={symptoms} setSymptoms={setSymptoms} onNext={() => nextStep(3)} />}
            {step === 3 && <Step3Photo setWound={setWound} onNext={() => nextStep(4)} />}
            {step === 4 && (
              showFullChat ? (
                <div className="flex flex-col h-full">
                  <h2 className="font-display text-3xl font-semibold mb-6 text-center text-text-primary">Daily Check-in with Maya</h2>
                  <PPDChat 
                    patientId={auth.currentUser?.uid || ''} 
                    onComplete={(m: number) => submitCheckin(m)} 
                    onSkip={() => submitCheckin(3)}
                  />
                </div>
              ) : (
                <Step4Mood onNext={(m: number) => submitCheckin(m)} loading={loading} />
              )
            )}
            {step === 5 && <Step5Wellbeing wellbeing={wellbeing} setWellbeing={setWellbeing} onNext={() => nextStep(6)} />}
            {step === 6 && <Step6Wellbeing2 wellbeing={wellbeing} setWellbeing={setWellbeing} onNext={() => nextStep(7)} />}
            {step === 7 && <Step7Results result={analysisResult} onClose={closeSheet} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}

// --- STEP 1: VITALS ---
function Step1Vitals({ vitals, setVitals, onNext }: any) {
  const handleChange = (field: string, val: string) => setVitals({ ...vitals, [field]: parseFloat(val) || 0 });
  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-4">
      <h2 className="font-display text-3xl font-semibold mb-6 text-center">Vitals</h2>
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface p-4 rounded-2xl">
            <label className="text-sm font-medium mb-2 block">Systolic BP</label>
            <input type="number" className="w-full text-2xl font-bold bg-transparent border-b outline-none" value={vitals.systolic} onChange={e => handleChange('systolic', e.target.value)} />
          </div>
          <div className="bg-surface p-4 rounded-2xl">
            <label className="text-sm font-medium mb-2 block">Diastolic BP</label>
            <input type="number" className="w-full text-2xl font-bold bg-transparent border-b outline-none" value={vitals.diastolic} onChange={e => handleChange('diastolic', e.target.value)} />
          </div>
          <div className="bg-surface p-4 rounded-2xl">
            <label className="text-sm font-medium mb-2 block">Heart Rate</label>
            <input type="number" className="w-full text-2xl font-bold bg-transparent border-b outline-none" value={vitals.heart_rate} onChange={e => handleChange('heart_rate', e.target.value)} />
          </div>
          <div className="bg-surface p-4 rounded-2xl">
            <label className="text-sm font-medium mb-2 block">Temp (°C)</label>
            <input type="number" step="0.1" className="w-full text-2xl font-bold bg-transparent border-b outline-none" value={vitals.temperature} onChange={e => handleChange('temperature', e.target.value)} />
          </div>
          <div className="bg-surface p-4 rounded-2xl">
            <label className="text-sm font-medium mb-2 block">SpO2 (%)</label>
            <input type="number" className="w-full text-2xl font-bold bg-transparent border-b outline-none" value={vitals.spo2} onChange={e => handleChange('spo2', e.target.value)} />
          </div>
          <div className="bg-surface p-4 rounded-2xl">
            <label className="text-sm font-medium mb-2 block">Weight (kg)</label>
            <input type="number" step="0.1" className="w-full text-2xl font-bold bg-transparent border-b outline-none" value={vitals.weight_kg} onChange={e => handleChange('weight_kg', e.target.value)} />
          </div>
        </div>
      </div>
      <button onClick={onNext} className="mt-8 mb-8 w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-soft uppercase">Continue</button>
    </div>
  );
}

// --- STEP 2: SYMPTOMS ---
function Step2Symptoms({ symptoms, setSymptoms, onNext }: any) {
  const toggle = (k: string) => setSymptoms({ ...symptoms, [k]: !symptoms[k] });
  const boolSymps = [
    { key: "headache", label: "Headache", icon: "🤯" },
    { key: "visual_disturbance", label: "Blurry vision", icon: "👁️" },
    { key: "leg_swelling", label: "Leg swelling", icon: "🦵" },
    { key: "shortness_of_breath", label: "Short breath", icon: "😮‍💨" },
    { key: "heavy_bleeding", label: "Heavy bleeding", icon: "🩸" },
    { key: "nausea", label: "Nausea", icon: "🤢" },
    { key: "extreme_fatigue", label: "Extreme fatigue", icon: "🥱" },
  ];

  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-4">
      <h2 className="font-display text-3xl font-semibold mb-6 text-center">Symptoms</h2>
      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {boolSymps.map(s => (
            <motion.button
              key={s.key} whileTap={{ scale: 0.95 }} onClick={() => toggle(s.key)}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-colors ${symptoms[s.key] ? "bg-primary border-primary text-white" : "bg-surface border-transparent"}`}
            >
              <span className="text-2xl">{s.icon}</span>
              <span className="font-medium text-sm">{s.label}</span>
            </motion.button>
          ))}
        </div>
        
        <div className="bg-surface p-4 rounded-2xl">
          <label className="font-medium block mb-2">Pain Level (0-10): {symptoms.pain_level}</label>
          <input type="range" min="0" max="10" value={symptoms.pain_level} onChange={(e) => setSymptoms({ ...symptoms, pain_level: parseInt(e.target.value) })} className="w-full accent-primary" />
        </div>

        <div className="bg-surface p-4 rounded-2xl mb-8">
          <label className="font-medium block mb-2">Bleeding Level</label>
          <select value={symptoms.bleeding_level} onChange={(e) => setSymptoms({...symptoms, bleeding_level: e.target.value})} className="w-full p-2 rounded bg-white border">
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="heavy">Heavy</option>
            <option value="clots">Clots</option>
          </select>
        </div>
      </div>
      <button onClick={onNext} className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-soft mt-4">Record Symptoms</button>
    </div>
  );
}

// --- STEP 3: PHOTO ---
function Step3Photo({ setWound, onNext }: any) {
  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-8 text-center items-center justify-center">
      <h2 className="font-display text-3xl font-semibold mb-4 text-text-primary">Wound Healing (C-Section)</h2>
      <p className="text-text-secondary mb-12 text-lg">If you had a C-Section, securely take a photo of your incision area.</p>
      <div className="w-48 h-48 bg-secondary-light rounded-full mb-12 flex items-center justify-center relative shadow-soft">
        <Camera className="w-16 h-16 text-secondary" />
      </div>
      <button onClick={() => { setWound({ applicable: true, photo_score: "monitor" }); setTimeout(onNext, 400); }} className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-soft flex justify-center items-center gap-2">
        <Camera className="w-5 h-5" /> Take a photo
      </button>
      <button onClick={() => { setWound({ applicable: false, photo_score: null }); onNext(); }} className="mt-8 mb-8 w-full py-4 text-text-muted rounded-2xl font-medium text-lg active:scale-95 transition-all">
        Skip / Not Applicable
      </button>
    </div>
  );
}

// --- STEP 4: MOOD ---
// FIX 6: Button is disabled while loading to prevent double-submission
function Step4Mood({ onNext, loading }: any) {
  const MOODS = [{ val: 1, emoji: '😔' }, { val: 2, emoji: '😕' }, { val: 3, emoji: '😐' }, { val: 4, emoji: '🙂' }, { val: 5, emoji: '😊' }];
  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-16">
      <h2 className="font-display text-3xl font-semibold mb-12 text-center text-text-primary">How are you feeling emotionally?</h2>
      <div
        className="flex justify-between items-center w-full bg-surface p-6 rounded-[24px] shadow-soft flex-1 max-h-[160px] transition-opacity"
        style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
      >
        {MOODS.map((m) => (
          <motion.button
            key={m.val}
            onClick={() => !loading && onNext(m.val)}
            whileHover={{ scale: 1.2, y: -10 }}
            whileTap={{ scale: 0.9 }}
            disabled={loading}
            className={`text-4xl sm:text-5xl origin-bottom transition-all ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {m.emoji}
          </motion.button>
        ))}
      </div>
      {loading && <p className="text-center mt-8 text-primary animate-pulse font-medium">Running advanced AI analysis...</p>}
    </div>
  );
}

// --- STEP 5: WELLBEING — Sleep & Activity ---
function Step5Wellbeing({ wellbeing, setWellbeing, onNext }: any) {
  const s = wellbeing.sleep;
  const a = wellbeing.activity;
  const setS = (k: string, v: any) => setWellbeing({ ...wellbeing, sleep: { ...s, [k]: v } });
  const setA = (k: string, v: any) => setWellbeing({ ...wellbeing, activity: { ...a, [k]: v } });

  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-4">
      <h2 className="font-display text-3xl font-semibold mb-6 text-center">How did you rest today?</h2>
      <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar">

        {/* Sleep */}
        <div className="bg-surface p-4 rounded-2xl">
          <p className="text-sm font-semibold mb-4">🌙 Sleep last night</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Total hours slept</label>
              <input type="number" step="0.5" min="0" max="24"
                className="w-full text-2xl font-bold bg-transparent border-b outline-none"
                value={s.total_hours} onChange={e => setS('total_hours', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Longest stretch (hours)</label>
              <input type="number" step="0.5" min="0" max="12"
                className="w-full text-xl font-bold bg-transparent border-b outline-none"
                value={s.longest_stretch_hours} onChange={e => setS('longest_stretch_hours', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">Baby wake-ups last night</label>
              <div className="flex gap-2">
                {[{label:'0', val:0},{label:'1-2', val:1},{label:'3-4', val:3},{label:'5+', val:5}].map(opt => (
                  <button key={opt.label}
                    onClick={() => setS('night_wakings', opt.val)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${s.night_wakings === opt.val ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'}`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-2">Sleep quality</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setS('sleep_quality', n)}
                    className={`text-2xl transition-transform active:scale-90 ${n <= s.sleep_quality ? '' : 'grayscale opacity-30'}`}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-surface p-4 rounded-2xl mb-8">
          <p className="text-sm font-semibold mb-4">👣 Activity today</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Did you get a short walk?</label>
              <div className="flex gap-2">
                <button onClick={() => setA('walked_today', true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${a.walked_today ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-text-secondary'}`}>Yes</button>
                <button onClick={() => setA('walked_today', false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!a.walked_today ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-text-secondary'}`}>No</button>
              </div>
            </div>
            {a.walked_today && (
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">How long? ({a.walk_duration_minutes ?? 15} mins)</label>
                <input type="range" min="5" max="60" step="5" value={a.walk_duration_minutes ?? 15}
                  onChange={e => setA('walk_duration_minutes', parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Did exhaustion stop you moving?</label>
              <div className="flex gap-2">
                <button onClick={() => setA('felt_too_tired_to_move', true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${a.felt_too_tired_to_move ? 'bg-amber-400 text-white' : 'bg-gray-100 text-text-secondary'}`}>Yes</button>
                <button onClick={() => setA('felt_too_tired_to_move', false)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${!a.felt_too_tired_to_move ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-text-secondary'}`}>No</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button onClick={onNext} className="mt-4 mb-8 w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-soft">Continue</button>
    </div>
  );
}

// --- STEP 6: WELLBEING — Emotional check ---
function Step6Wellbeing2({ wellbeing, setWellbeing, onNext }: any) {
  const h = wellbeing.hormonal;
  const setH = (k: string, v: any) => setWellbeing({ ...wellbeing, hormonal: { ...h, [k]: v } });

  const bondingOptions = [
    { label: 'Yes 💛', val: true },
    { label: 'Somewhat 🤍', val: null },
    { label: 'Not really', val: false },
  ];

  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-4">
      <h2 className="font-display text-3xl font-semibold mb-2 text-center">How are you feeling?</h2>
      <p className="text-center text-text-secondary text-sm mb-6">There are no wrong answers here — this is just for you.</p>
      <div className="space-y-5 flex-1 overflow-y-auto hide-scrollbar">

        <div className="bg-surface p-4 rounded-2xl">
          <label className="text-sm font-medium block mb-3">Did you feel connected to your baby today?</label>
          <div className="flex gap-2">
            {bondingOptions.map(opt => (
              <button key={opt.label} onClick={() => setH('felt_bonded_with_baby', opt.val === null ? true : opt.val)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  (opt.val === true && h.felt_bonded_with_baby === true) ||
                  (opt.val === false && h.felt_bonded_with_baby === false)
                    ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl">
          <label className="text-sm font-medium block mb-3">Did you have support from family or partner?</label>
          <div className="flex gap-3">
            <button onClick={() => setH('support_received_today', true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${h.support_received_today ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-text-secondary'}`}>Yes</button>
            <button onClick={() => setH('support_received_today', false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${!h.support_received_today ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-text-secondary'}`}>No</button>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl">
          <label className="text-sm font-medium block mb-3">Any tears or crying today? <span className="text-text-muted text-xs">(that&apos;s okay)</span></label>
          <div className="flex gap-3">
            <button onClick={() => setH('crying_spells', true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${h.crying_spells ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'}`}>Yes</button>
            <button onClick={() => setH('crying_spells', false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${!h.crying_spells ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-text-secondary'}`}>No</button>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl">
          <label className="text-sm font-medium block mb-2">Anxiety level today (1 = calm, 5 = very anxious)</label>
          <input type="range" min="1" max="5" step="1" value={h.anxiety_level}
            onChange={e => setH('anxiety_level', parseInt(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Calm 😌</span><span>Very anxious 😰</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl mb-8">
          <label className="text-sm font-medium block mb-3">Did you feel overwhelmed today?</label>
          <div className="flex gap-3">
            <button onClick={() => setH('felt_overwhelmed', true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${h.felt_overwhelmed ? 'bg-amber-400 text-white' : 'bg-gray-100 text-text-secondary'}`}>Yes</button>
            <button onClick={() => setH('felt_overwhelmed', false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${!h.felt_overwhelmed ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-text-secondary'}`}>No</button>
          </div>
        </div>
      </div>
      <button onClick={onNext} className="mt-4 mb-8 w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-soft">All done — see my results</button>
    </div>
  );
}

// --- STEP 7: RESULTS (renamed from Step5Results) ---
function Step7Results({ result, onClose }: any) {
  const isGreen = result?.alert_level === "GREEN";
  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full pt-8 text-center items-center justify-center">
      {isGreen ? <CheckInSuccess isGreen={true} /> : <div className="text-6xl mb-4">⚠️</div>}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}>
        <h2 className="font-display text-3xl font-semibold mb-2 text-text-primary">{result?.patient_message || "All done."}</h2>
        <p className="text-text-secondary mb-8 text-lg">{result?.recommended_action || "Rest up."}</p>
        {result?.doctor_notification?.required && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left mb-12 shadow-soft">
            <p className="font-semibold text-red-700 flex items-center gap-2 mb-1">Your doctor was notified.</p>
          </div>
        )}
      </motion.div>
      <div className="w-full mt-auto mb-8">
        <button onClick={onClose} className="w-full py-4 text-white rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-soft bg-primary">
          Open Dashboard
        </button>
      </div>
    </div>
  );
}
