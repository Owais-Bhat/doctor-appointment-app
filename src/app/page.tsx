"use client";

import { Navbar } from "../components/Navbar";
import { HealthBento } from "../components/HealthBento";
import { SymptomMapper } from "../components/SymptomMapper";
import { FluidBooking } from "../components/FluidBooking";
import { AIBot } from "../components/AIBot";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center p-6 overflow-hidden">
      <Navbar />
      <AIBot />

      {/* Decorative Background Blobs for Xtract look */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/10 blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-secondary/10 blur-[120px] -z-10" />

      <div className="flex flex-col items-center justify-center pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Healthcare <br /> reimagined.
          </h1>
          <p className="text-lg md:text-xl opacity-60 mb-10 max-w-lg mx-auto">
            Experience the next generation of medical appointments. Fluid, minimal, and connected.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/client/book'}
              className="px-8 py-4 rounded-full bg-brand-primary text-white font-semibold shadow-lg shadow-brand-primary/20"
            >
              Book Doctor
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-6xl mx-auto space-y-32 pb-32">
        <HealthBento />
        <FluidBooking />
      </div>
    </main>
  );
}
