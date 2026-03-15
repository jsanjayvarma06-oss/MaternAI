"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function VitalsCardFlip({
  frontContent,
  backContent,
  className = ""
}: {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 w-full h-full bg-surface shadow-soft rounded-[16px] overflow-hidden" 
          style={{ backfaceVisibility: "hidden" }}
        >
          {frontContent}
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full bg-surface shadow-soft rounded-[16px] overflow-hidden" 
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {backContent}
        </div>
      </motion.div>
    </div>
  );
}
