"use client";

import React from 'react';
import Link from 'next/link';
import { Users, Activity, ShieldAlert } from 'lucide-react';

export default function DoctorDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Doctor Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your clinic's postpartum patients.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/doctor/alerts" className="group bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900/30 rounded-3xl p-6 hover:shadow-lg transition-all cursor-pointer block">
            <div className="p-3 bg-white dark:bg-red-900/30 rounded-2xl w-max mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <ShieldAlert className="text-red-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Active Alerts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View real-time RED patient alerts</p>
          </Link>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 block text-left">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl w-max mb-4 shadow-sm">
              <Users className="text-indigo-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">My Patients</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage 24 active monitors</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 block text-left">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl w-max mb-4 shadow-sm">
              <Activity className="text-emerald-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Weekly Reports</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View stable patient updates</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 mt-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Recent Patient Check-ins</h2>
          <div className="space-y-4">
            {/* Mock recent list */}
            {[
              { name: "Sarah Smith", day: 5, status: "GREEN", time: "10 mins ago" },
              { name: "Emily Chen", day: 12, status: "YELLOW", time: "1 hour ago" },
              { name: "Jessica Doe", day: 2, status: "GREEN", time: "3 hours ago" }
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</h3>
                  <p className="text-sm text-gray-500">Day {p.day} postpartum • {p.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  p.status === 'GREEN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
