"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase'; // Ensure you're importing Firebase properly
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ShieldAlert, Activity, CheckCircle, Clock } from 'lucide-react';

export default function DoctorAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener on Firebase
    const alertsRef = collection(db, "alerts");
    const q = query(
      alertsRef,
      where("status", "==", "unread"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts: any[] = [];
      snapshot.forEach((doc) => {
        fetchedAlerts.push({ id: doc.id, ...doc.data() });
      });
      setAlerts(fetchedAlerts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching real-time alerts: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    // In a real app we'd trigger an API or use updateDoc directly
    // import { doc, updateDoc } from "firebase/firestore";
    // await updateDoc(doc(db, "alerts", id), { status: "read" });
    alert(`Alert ${id} marked as read`);
  };

  if (loading) return <div className="min-h-screen p-8 text-center text-gray-500">Connecting to secure health relay...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b pb-6 dark:border-gray-800">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <ShieldAlert className="text-red-600 dark:text-red-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Active Patient Alerts</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time triage monitor</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-12 text-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-75" />
            <h2 className="text-2xl font-bold mb-2">Clear Board</h2>
            <p>No active unread alerts for your patients.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-red-200 dark:border-red-900/30 rounded-3xl p-6 shadow-sm shadow-red-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-red-500 animate-pulse"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-bold tracking-wide rounded-full uppercase">
                        {alert.alert_level}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} /> Just now
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Condition Trigger: {alert.triggered_by}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed max-w-2xl">
                      {alert.clinical_summary}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="flex-1 md:flex-none px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                    >
                      Acknowledge
                    </button>
                    <a 
                      href="tel:+1234567890"
                      className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-indigo-500/20 transition-transform active:scale-95 flex justify-center items-center gap-2"
                    >
                      <Activity size={18} /> Call Patient
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
