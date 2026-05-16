"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Search, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-surface-100/80 backdrop-blur-md border-b border-surface-300 px-6 flex items-center justify-between">
      <div className="flex items-center flex-1 max-w-xl relative">
        <Search className="absolute left-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search anything... (⌘K)"
          className="w-full pl-10 pr-4 py-2 rounded-full bg-surface-200 border-transparent focus:bg-white focus:ring-2 focus:ring-brand-primary transition-all outline-none text-sm"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-surface-200 transition-colors text-gray-600">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-accent rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l border-surface-300">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{user?.displayName || 'User'}</p>
            <p className="text-xs text-gray-500">Account</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={24} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
