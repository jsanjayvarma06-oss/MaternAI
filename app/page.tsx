import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl text-center border border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Activity size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">MaternaAI</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Physical Recovery Monitor Engine 1</p>
        
        <div className="space-y-4">
          <Link href="/dashboard" className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 text-center">
            Patient Dashboard
          </Link>
          <Link href="/checkin" className="block w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-pink-500/20 active:scale-95 text-center">
            Daily Check-in
          </Link>
          <Link href="/doctor" className="block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20 active:scale-95 text-center">
            Doctor Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
