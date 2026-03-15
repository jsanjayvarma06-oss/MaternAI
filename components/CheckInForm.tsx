"use client";

import React, { useState } from 'react';
import { WoundPhotoUpload } from './WoundPhotoUpload';

interface CheckInData {
  vitals: {
    systolic: number;
    diastolic: number;
    heart_rate: number;
    temperature: number;
    spo2: number;
    weight_kg: number;
  };
  symptoms: {
    bleeding_level: string;
    pain_level: number;
    headache: boolean;
    visual_disturbance: boolean;
    leg_swelling: boolean;
    shortness_of_breath: boolean;
  };
  wound_photo?: string;
}

interface CheckInFormProps {
  patientData: {
    day_post_delivery: number;
    delivery_type: string;
  };
  onSubmit: (data: CheckInData) => void;
  isLoading: boolean;
}

export const CheckInForm: React.FC<CheckInFormProps> = ({ patientData, onSubmit, isLoading }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CheckInData>({
    vitals: {
      systolic: 120, diastolic: 80, heart_rate: 75, temperature: 37.0, spo2: 98, weight_kg: 65.0
    },
    symptoms: {
      bleeding_level: "light", pain_level: 2, headache: false, visual_disturbance: false, leg_swelling: false, shortness_of_breath: false
    }
  });

  const totalSteps = patientData.delivery_type.toLowerCase() === 'c-section' ? 3 : 2;

  const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, vitals: { ...data.vitals, [e.target.name]: parseFloat(e.target.value) }});
  };

  const handleSymptomsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setData({ ...data, symptoms: { ...data.symptoms, [e.target.name]: e.target.type === 'range' ? parseInt(value as string) : value }});
  };

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Health Check-in</h2>
        <span className="text-sm font-medium px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
          Step {step} of {totalSteps}
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2">1. Record Your Vitals</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Systolic BP (mmHg)</label>
              <input type="number" name="systolic" value={data.vitals.systolic} onChange={handleVitalsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Diastolic BP (mmHg)</label>
              <input type="number" name="diastolic" value={data.vitals.diastolic} onChange={handleVitalsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Heart Rate (bpm)</label>
              <input type="number" name="heart_rate" value={data.vitals.heart_rate} onChange={handleVitalsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Temperature (°C)</label>
              <input type="number" step="0.1" name="temperature" value={data.vitals.temperature} onChange={handleVitalsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">SpO2 (%)</label>
              <input type="number" name="spo2" value={data.vitals.spo2} onChange={handleVitalsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Weight (kg)</label>
              <input type="number" step="0.1" name="weight_kg" value={data.vitals.weight_kg} onChange={handleVitalsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <button onClick={() => setStep(2)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
            Next: Symptoms
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-2">2. How are you feeling?</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pain Level (0-10): {data.symptoms.pain_level}</label>
              <input type="range" name="pain_level" min="0" max="10" value={data.symptoms.pain_level} onChange={handleSymptomsChange} className="w-full accent-indigo-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postpartum Bleeding</label>
              <select name="bleeding_level" value={data.symptoms.bleeding_level} onChange={handleSymptomsChange} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:border-gray-700">
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
                <option value="clots">Passing Clots</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-3 border rounded-xl dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" name="headache" checked={data.symptoms.headache} onChange={handleSymptomsChange} className="w-5 h-5 accent-indigo-600 rounded" />
                <span className="text-sm">Severe Headache</span>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-xl dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" name="visual_disturbance" checked={data.symptoms.visual_disturbance} onChange={handleSymptomsChange} className="w-5 h-5 accent-indigo-600 rounded" />
                <span className="text-sm">Blurry Vision</span>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-xl dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" name="leg_swelling" checked={data.symptoms.leg_swelling} onChange={handleSymptomsChange} className="w-5 h-5 accent-indigo-600 rounded" />
                <span className="text-sm">Leg Swelling</span>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-xl dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" name="shortness_of_breath" checked={data.symptoms.shortness_of_breath} onChange={handleSymptomsChange} className="w-5 h-5 accent-indigo-600 rounded" />
                <span className="text-sm">Short of Breath</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="w-1/3 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-semibold transition-colors">Back</button>
            <button 
              onClick={totalSteps === 3 ? () => setStep(3) : handleSubmit} 
              disabled={isLoading}
              className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : totalSteps === 3 ? 'Next: Wound Check' : 'Submit Check-in'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && totalSteps === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <WoundPhotoUpload 
            dayPostDelivery={patientData.day_post_delivery}
            onPhotoCapture={(base64Data) => setData({...data, wound_photo: base64Data})} 
          />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="w-1/3 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-semibold transition-colors">Back</button>
            <button 
              onClick={handleSubmit}
              disabled={isLoading || !data.wound_photo} 
              className="w-2/3 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-pink-500/30 disabled:opacity-50"
            >
              {isLoading ? 'Analyzing...' : 'Complete Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
