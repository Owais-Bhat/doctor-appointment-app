"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/firebase';

export default function LoginPage() {
  const { signIn, isLoading, role } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMSG, setErrorMSG] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (role === 'doctor') router.push('/admin/dashboard');
    if (role === 'patient') router.push('/client/dashboard');
    if (role === 'super_admin') router.push('/super-admin/dashboard');
  }, [role, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoggingIn(true);
    setErrorMSG('');
    try {
      await signInWithEmail(email, password);
      // AuthContext will automatically redirect upon state change
    } catch (err: any) {
      setErrorMSG("Invalid email or password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-200">
      <div className="bg-surface-100 p-8 rounded-3xl shadow-xl border border-surface-300 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-brand-primary mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-6">Sign in to manage your health journey</p>

        {errorMSG && (
          <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
          <input 
            type="email" 
            placeholder="Official Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none"
            required
          />
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none"
            required
          />
          <button 
            type="submit" 
            disabled={isLoggingIn || isLoading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl transition-all shadow disabled:opacity-50"
          >
            {isLoggingIn ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-surface-300 flex-1"></div>
          <span className="text-sm text-gray-400">or</span>
          <div className="h-px bg-surface-300 flex-1"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          type="button"
          disabled={isLoading || isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-surface-300 p-3 rounded-xl hover:bg-surface-200 transition-all font-medium"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="mt-6 text-sm text-gray-500">
          New Patient? <a href="/auth/register" className="text-brand-primary font-semibold">Register here</a>
        </div>
      </div>
    </div>
  );
}
