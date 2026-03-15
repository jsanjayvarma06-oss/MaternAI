"use client";
import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function StaggeredList({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
