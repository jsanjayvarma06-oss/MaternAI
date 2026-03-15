"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function RiskScoreAnimator({ score, maxScore = 100, colorClass = "bg-primary" }: { score: number, maxScore?: number, colorClass?: string }) {
  const springScore = useSpring(0, { stiffness: 60, damping: 15 });
  
  // Note: we're only animating the width of the bar here, we are not displaying the raw number as per raw spec: "Never show the raw number to patient"

  useEffect(() => {
    springScore.set(score);
  }, [score, springScore]);

  const width = useTransform(springScore, [0, maxScore], ["0%", "100%"]);

  return (
    <div className="w-full bg-background rounded-full h-2 overflow-hidden">
      <motion.div 
        className={`h-full ${colorClass}`} 
        style={{ width }}
      />
    </div>
  );
}
