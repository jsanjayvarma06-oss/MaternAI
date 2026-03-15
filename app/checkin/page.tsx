"use client";

import React, { useState } from 'react';
import { CheckInForm } from '@/components/CheckInForm';
import { useRouter } from 'next/navigation';

export default function CheckInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Mock API trigger
      const response = await fetch('http://localhost:8000/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: "patient_123",
          patient_data: { name: "Sarah Smith", age: 32, delivery_type: "c-section", delivery_date: "2026-03-10", day_post_delivery: 5, risk_factors: [] },
          vitals: data.vitals,
          symptoms: data.symptoms,
          wound_photo: data.wound_photo || null
        })
      });
      
      // Navigate on success
      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert("Check-in failed. Ensure backend is running.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error connecting to AI engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:py-12 flex items-center justify-center">
      <div className="w-full">
        <CheckInForm 
          patientData={{ day_post_delivery: 5, delivery_type: 'c-section' }}
          onSubmit={handleSubmit}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
