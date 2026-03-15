"use client";

import { Home, Calendar, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  
  // Hide on checkin flow since it's a full screen modal
  if (pathname === '/checkin') return null;

  return (
    <div className="fixed bottom-0 w-full bg-surface border-t border-text-muted/20 pb-safe z-40 md:hidden pb-4">
      <div className="flex justify-around items-center h-16 w-full max-w-md mx-auto px-4">
        
        <Link href="/dashboard" className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <Home className="w-6 h-6 text-primary" />
          <span className="text-[10px] font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">Home</span>
        </Link>
        
        <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform opacity-50">
          <Calendar className="w-6 h-6 text-text-secondary" />
          <span className="text-[10px] font-medium text-text-secondary">Plan</span>
        </button>

        <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform opacity-50">
          <MessageCircle className="w-6 h-6 text-text-secondary" />
          <span className="text-[10px] font-medium text-text-secondary">Chat</span>
        </button>

        <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform opacity-50">
          <User className="w-6 h-6 text-text-secondary" />
          <span className="text-[10px] font-medium text-text-secondary">Profile</span>
        </button>

      </div>
    </div>
  );
}
