"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function CheckInSuccess({ isGreen = false }: { isGreen?: boolean }) {
  useEffect(() => {
    if (isGreen) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E8927C', '#7BB5A2', '#6BAE8E'],
          disableForReducedMotion: true,
        });
      }, 600);
    }
  }, [isGreen]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.1, 1] }}
        transition={{ duration: 0.6, times: [0, 0.5, 1], ease: "easeOut" }}
        className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6"
      >
        <svg
          className="w-12 h-12 text-success"
          fill="none"
          strokeWidth="3"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>
    </div>
  );
}
