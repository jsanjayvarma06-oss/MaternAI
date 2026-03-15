"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
  "Reading your vitals...",
  "Checking patterns...",
  "Almost done..."
];

export default function LoadingPulse() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {/* 3 pulsing dots */}
      <div className="flex space-x-2 h-8 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-primary rounded-full origin-center"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Text cycle */}
      <div className="h-6 relative flex justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="text-text-secondary font-medium absolute"
          >
            {messages[msgIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
