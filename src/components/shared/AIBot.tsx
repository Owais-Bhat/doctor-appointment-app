"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
    } catch {
      toast.error("AI Assistant is currently unavailable.");
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-widget fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="chat-panel glass-strong mb-4 w-96 h-[500px] flex flex-col overflow-hidden fade-enter">
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <div>
                <h3 className="font-bold text-sm">MediFlow AI Assistant</h3>
                <p className="text-[10px] opacity-80">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="icon-btn" style={{ color: "inherit", background: "rgba(255,255,255,.12)" }} aria-label="Close AI assistant">
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
                  msg.role === 'user' ? "text-white" : ""
                )}
                  style={{
                    background: msg.role === 'user' ? "var(--accent)" : "var(--glass)",
                    color: msg.role === 'user' ? "var(--accent-ink)" : "var(--accent)",
                  }}
                >
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user'
                    ? "text-white rounded-tr-none"
                    : "rounded-tl-none"
                )}
                  style={{
                    background: msg.role === 'user' ? "var(--accent)" : "var(--glass)",
                    color: msg.role === 'user' ? "var(--accent-ink)" : "var(--ink)",
                    border: msg.role === 'user' ? "1px solid transparent" : "1px solid var(--line)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 max-w-[80%] animate-pulse">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--glass)", color: "var(--accent)" }}>
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none" style={{ background: "var(--glass)", border: "1px solid var(--line)" }}>
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
          <form onSubmit={handleSend} className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--line)", background: "var(--glass)" }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Describe your symptoms..."
              className="input"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="btn btn-primary btn-icon disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle btn btn-primary btn-icon shadow-xl active:scale-95 group relative"
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full border-2 border-white animate-ping" />
        )}
      </button>
    </div>
  );
}

