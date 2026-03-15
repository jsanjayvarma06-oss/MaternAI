"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [isLogin, setIsLogin] = useState(true);
  
  // Registration Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [deliveryType, setDeliveryType] = useState<"vaginal" | "c-section">("vaginal");
  const [doctorId, setDoctorId] = useState("");
  const [clinic, setClinic] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Just login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Fetch status
        const statusRes = await fetch(`http://localhost:8000/users/status/${uid}`);
        if (statusRes.ok) {
          const { role, has_checked_in_today } = await statusRes.json();
          if (role === "doctor") {
            router.push("/doctor");
          } else {
            router.push(has_checked_in_today ? "/dashboard" : "/checkin");
          }
        } else {
          // Fallback if user document somehow doesn't exist but auth exists
          router.push(role === "patient" ? "/checkin" : "/doctor");
        }
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Post profile to our FastAPI backend
        const profileData = role === "patient" ? {
          uid,
          role,
          name,
          age: parseInt(age),
          child_birthdate: childBirthdate,
          delivery_type: deliveryType,
          doctor_id: doctorId
        } : {
          uid,
          role,
          name,
          hospital: clinic,
          specialization
        };

        const res = await fetch("http://localhost:8000/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData)
        });

        if (!res.ok) throw new Error("Failed to save profile to database");

        router.push(role === "patient" ? "/checkin" : "/doctor");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-text-muted/20 rounded-3xl p-8 shadow-xl"
      >
        <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Activity size={32} />
        </div>
        <h1 className="text-3xl font-bold text-center text-text-primary mb-2">MaternaAI</h1>
        <p className="text-center text-text-secondary mb-8">{isLogin ? "Welcome back" : "Create your account"}</p>

        {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl mb-4 text-sm">{error}</div>}

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === 'patient' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            onClick={() => setRole("patient")}
          >
            Patient
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${role === 'doctor' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            onClick={() => setRole("doctor")}
          >
            Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-2">
              <input 
                type="text" placeholder="Full Name" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={name} onChange={(e) => setName(e.target.value)}
              />
              
              {role === "patient" && (
                <>
                  <input type="number" placeholder="Age" required className="w-full px-4 py-3 rounded-xl border border-gray-200" value={age} onChange={(e) => setAge(e.target.value)} />
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary pl-2">Child's Birthdate</label>
                    <input type="date" required className="w-full px-4 py-3 rounded-xl border border-gray-200" value={childBirthdate} onChange={(e) => setChildBirthdate(e.target.value)} />
                  </div>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as any)}>
                    <option value="vaginal">Vaginal Delivery</option>
                    <option value="c-section">C-Section</option>
                  </select>
                  <input type="text" placeholder="Assigned Doctor ID (Optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
                </>
              )}

              {role === "doctor" && (
                <>
                  <input type="text" placeholder="Hospital / Clinic" required className="w-full px-4 py-3 rounded-xl border border-gray-200" value={clinic} onChange={(e) => setClinic(e.target.value)} />
                  <input type="text" placeholder="Specialization" required className="w-full px-4 py-3 rounded-xl border border-gray-200" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                </>
              )}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center justify-center mt-6 disabled:opacity-70"
          >
            {loading ? "Please wait..." : (isLogin ? "Sign in" : "Create Account")}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

      </motion.div>
    </div>
  );
}
