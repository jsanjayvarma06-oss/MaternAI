"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, X, Activity, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardCharts } from '@/components/DashboardCharts';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/doctors/${user.uid}/dashboard`);
        if (!res.ok) throw new Error("Failed to fetch doctor dashboard");
        const json = await res.json();
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-4 font-body">
        <Activity className="w-8 h-8 animate-pulse text-emerald-500" />
        <p>Loading your patients...</p>
      </div>
    );
  }

  const alerts = data?.alerts || [];
  const patients = data?.patients || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:py-12 pb-24 font-body">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white">Doctor Portal</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Overview of your assigned postpartum patients.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Priority Alerts Panel */}
          <div className="lg:col-span-1 border-2 border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 rounded-3xl p-6 flex flex-col h-[600px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold font-display text-red-900 dark:text-red-100">Priority Alerts</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {alerts.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No unread alerts.</p>
              ) : (
                alerts.map((a: any) => (
                  <motion.div 
                    key={a._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPatientId(a.patient_id)}
                    className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{a.patient_name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        {a.alert_level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">{a.clinical_summary}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Patient List */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 flex flex-col h-[600px]">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold font-display text-gray-900 dark:text-gray-100">All Patients</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 content-start flex-1">
              {patients.length === 0 ? (
                <p className="text-gray-500 italic text-sm col-span-2">You have no patients assigned yet.</p>
              ) : (
                patients.map((p: any) => (
                  <motion.div 
                    key={p._id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPatientId(p._id)}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{p.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">Age: {p.age} • Delivery: {p.delivery_type}</p>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        p.latest_alert_level === 'GREEN' ? 'bg-emerald-100 text-emerald-700' :
                        p.latest_alert_level === 'RED' ? 'bg-red-100 text-red-700' :
                        p.latest_alert_level === 'YELLOW' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {p.latest_alert_level || 'NONE'}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPatientId && (
          <PatientDetailModal 
            patientId={selectedPatientId} 
            onClose={() => setSelectedPatientId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Component for Patient Details
function PatientDetailModal({ patientId, onClose }: { patientId: string, onClose: () => void }) {
  const [detailData, setDetailData] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/doctors/patient/${patientId}`)
      .then(res => res.json())
      .then(json => setDetailData(json))
      .catch(console.error);
  }, [patientId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm font-body"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-gray-50 dark:bg-gray-950 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {!detailData ? (
          <div className="p-12 flex justify-center"><Activity className="w-8 h-8 animate-pulse text-indigo-500" /></div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{detailData.patient.name}</h2>
                <p className="text-sm text-gray-500 font-medium">{detailData.patient.age} years old • {detailData.patient.delivery_type} delivery</p>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Alert Ribbon */}
              {detailData.latest_analysis && (
                 <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm ${
                   detailData.latest_analysis.alert_level === 'RED' ? 'bg-red-50 text-red-900 border border-red-100' :
                   detailData.latest_analysis.alert_level === 'YELLOW' ? 'bg-amber-50 text-amber-900 border border-amber-100' :
                   'bg-emerald-50 text-emerald-900 border border-emerald-100'
                 }`}>
                   <ShieldAlert className="w-6 h-6" />
                   <div>
                     <h4 className="font-bold">Latest Alert Level: {detailData.latest_analysis.alert_level}</h4>
                     <p className="text-sm opacity-90">{detailData.latest_analysis.patient_message}</p>
                   </div>
                 </div>
              )}

              {/* 7-Day Charts */}
              {detailData.history && detailData.history.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DashboardCharts history={detailData.history} />
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                    {/* Insights Box */}
                    <div className="bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-indigo-900/20 dark:to-pink-900/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-800/30">
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-4">
                        <BrainCircuit className="w-5 h-5" /> Clinical Insights
                      </h4>
                      <ul className="space-y-3">
                        {detailData.latest_analysis?.insights?.map((ins: string, i: number) => (
                           <li key={i} className="text-sm text-gray-700 leading-snug flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                             {ins}
                           </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic p-4 text-center">No check-in history available for this patient.</p>
              )}

            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
