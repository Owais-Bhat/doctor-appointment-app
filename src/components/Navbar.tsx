"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-full glass transition-colors",
        "hover:bg-surface-200 dark:hover:bg-surface-300"
      )}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-yellow-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700" />
      )}
    </motion.button>
  );
}

export function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl">
      <div className="glass rounded-full px-6 py-3 flex items-center justify-between backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-bold tracking-tight"
        >
          Med<span className="text-brand-primary">Flow</span>
        </motion.div>

        <div className="flex items-center gap-6">
          <ul className="hidden md:flex items-center gap-6 text-sm font-medium opacity-80">
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Specialists</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">Booking</li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors">My Health</li>
          </ul>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
