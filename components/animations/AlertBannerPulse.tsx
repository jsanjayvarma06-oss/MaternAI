"use client";
import { motion } from "framer-motion";

export default function AlertBannerPulse({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
