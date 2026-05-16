"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Bot, X, Sparkles, Calendar, User, Activity } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createAppointment } from "@/app/actions";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AIBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! I'm your MedFlow AI. I can help you find the right specialist and book your appointment. What's on your mind today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(async () => {
      let botResponse = "";
      const text = input.toLowerCase();

      if (text.includes("book") || text.includes("appointment")) {
        botResponse = "I can certainly help you book. Please use the Fluid Booking timeline below to select your preferred slot!";
      } else if (text.includes("heart") || text.includes("chest")) {
        botResponse = "It sounds like you might need a Cardiologist. I recommend Dr. Sarah Jenkins. I've highlighted the booking section for you!";
      } else if (text.includes("who am i") || text.includes("my profile")) {
        botResponse = user
          ? `You are ${user.displayName || 'our valued patient'}. Your profile is currently synced with our medical database.`
          : "You aren't signed in yet. Please use the 'Sign In' button in the top right to access your health records.";
      } else {
        botResponse = "I'm here to assist. You can tell me your symptoms, or ask about booking an appointment with our specialists.";
      }

      setMessages(prev => [...prev, { role: "bot", content: botResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass w-80 h-[500px] rounded-3xl flex flex-col overflow-hidden shadow-2xl border-brand-primary/20 mb-4"
          >
            <div className="p-4 bg-brand-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold">MedFlow AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === "bot" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={cn("flex w-full", msg.role === "bot" ? "justify-start" : "justify-end")}
                >
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === "bot"
                      ? "bg-surface-200 dark:bg-surface-300 text-foreground rounded-tl-none"
                      : "bg-brand-primary text-white rounded-tr-none"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface-200 dark:bg-surface-300 p-3 rounded-2xl rounded-tl-none animate-pulse text-xs opacity-50">
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 glass border-t border-white/10">
              <div className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full bg-surface-200 dark:bg-surface-300 border-none rounded-full py-2 px-4 pr-12 text-sm focus:ring-2 ring-brand-primary outline-none"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 p-2 bg-brand-primary text-white rounded-full hover:scale-110 transition-transform"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass w-14 h-14 rounded-full flex items-center justify-center shadow-xl text-brand-primary border-brand-primary/30"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
