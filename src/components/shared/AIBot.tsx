"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function AIBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your MediFlow Health Assistant. Describe your symptoms, and I can help you find the right specialist. (Disclaimer: I am an AI, not a doctor. Always seek professional medical advice.)'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.uid
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI failed to respond');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      toast.error("AI Assistant is currently unavailable.");
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-surface-100 rounded-3xl border border-surface-300 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="p-4 bg-brand-primary text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <div>
                <h3 className="font-bold text-sm">MediFlow AI Assistant</h3>
                <p className="text-[10px] opacity-80">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Chat Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-brand-primary text-white" : "bg-surface-200 text-brand-primary"
                )}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user'
                    ? "bg-brand-primary text-white rounded-tr-none"
                    : "bg-surface-200 text-foreground rounded-tl-none border border-surface-300"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 max-w-[80%] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-200 text-brand-primary flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-surface-200 rounded-2xl rounded-tl-none border border-surface-300">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-surface-300 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe your symptoms..."
              className="flex-1 p-3 bg-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full border-2 border-white animate-ping" />
        )}
      </button>
    </div>
  );
}

