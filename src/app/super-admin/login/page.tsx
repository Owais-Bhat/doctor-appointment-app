"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signInWithEmail, registerWithEmail } from '@/lib/firebase';
import { Lock, ShieldAlert } from 'lucide-react';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('admin@cybermilo.com'); // Defaults to user request
  const [password, setPassword] = useState('Awais111@9149@'); // Defaults to user request
  const [errorMSG, setErrorMSG] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role === 'super_admin') {
      router.push('/super-admin/dashboard');
    }
  }, [role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG('');
    setLoading(true);

    try {
      // 1. Attempt standard login
      await signInWithEmail(email, password);
      // Let AuthContext redirect automatically upon detecting 'super_admin' role
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          // 2. If the user doesn't exist at all, silently auto-register them
          // *Must make sure to only do this for the dedicated admin email to avoid open registration abuse*
          if (email === 'admin@cybermilo.com') {
             await registerWithEmail(email, password);
          } else {
             setErrorMSG("Invalid Admin Credentials");
          }
        } catch (regErr: any) {
          setErrorMSG(regErr.message);
        }
      } else {
        setErrorMSG(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-100 p-8 rounded-3xl border border-surface-300 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 text-red-500">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-3xl font-bold text-center">System Admin</h1>
          <p className="text-gray-500 text-sm mt-2">Restricted Access Portal</p>
        </div>

        {errorMSG && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-white border border-surface-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passkey</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-3 bg-white border border-surface-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Authorize Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
