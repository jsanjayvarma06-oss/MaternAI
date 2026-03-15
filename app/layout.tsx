import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/animations/PageTransition";
import BottomNav from "@/components/BottomNav";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaternaAI",
  description: "Warm, friendly, and emotionally reassuring support for postpartum mothers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <PageTransition>{children}</PageTransition>
        <BottomNav />
      </body>
    </html>
  );
}
