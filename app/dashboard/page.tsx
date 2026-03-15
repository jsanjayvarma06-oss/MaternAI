"use client";

import React, { useEffect, useState } from 'react';
import { VitalsCard } from '@/components/VitalsCard';
import { RiskScoreCard } from '@/components/RiskScoreCard';
import { AlertBanner } from '@/components/AlertBanner';
import { TrendChart } from '@/components/TrendChart';
import Link from 'next/link';

// Mock Patient Data since auth is out of scope
const MOCK_PATIENT_ID = "patient_123";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch this from Firebase.
    // For scaffolding, we mock a recent check-in.
    setTimeout(() => {
      setData({
        vitals: { systolic: 125, diastolic: 82, heart_rate: 85, temperature: 37.1, spo2: 98, weight: 64.5 },
        riskScores: { preeclampsia: 20, hemorrhage: 0, blood_clot: 10, wound_infection: 0 },
        alertData: { level: "GREEN", message: "Your readings look great today! You are recovering well." },
        history: Array.from({ length: 7 }).map((_, i) => ({
          timestamp: new Date(Date.now() - (6 - i) * 86400000).toISOString(),
          systolic: 120 + Math.random() * 10,
          diastolic: 80 + Math.random() * 5,
          heart_rate: 70 + Math.random() * 15,
          temperature: 37.0
        }))
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">Loading your data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">MaternaAI Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back. Day 5 Postpartum.</p>
          </div>
          <Link 
            href="/checkin"
            className="inline-flex justify-center items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
          >
            Start Daily Check-in
          </Link>
        </div>

        <AlertBanner level={data.alertData.level} message={data.alertData.message} />
        
        <VitalsCard {...data.vitals} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TrendChart data={data.history} />
          <RiskScoreCard scores={data.riskScores} />
        </div>
        
      </div>
    </div>
  );
}
