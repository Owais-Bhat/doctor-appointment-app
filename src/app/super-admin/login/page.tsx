"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signInWithEmail, registerWithEmail } from '@/lib/firebase';
import { Lock, ShieldAlert, Mail } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-[var(--bg-2)] overflow-hidden">
      <div className="atmos" aria-hidden="true" />
      
      <div className="glass-strong max-w-md w-full p-8 relative z-10 transition-all duration-300">
        <div className="col gap-6" style={{ alignItems: "stretch" }}>
          
          {/* Header */}
          <div className="col gap-3" style={{ alignItems: "center" }}>
            <div className="avatar lg" style={{ background: "linear-gradient(135deg, var(--bad), var(--accent-2))" }}>
              <ShieldAlert size={28} />
            </div>
            <div className="col gap-1" style={{ alignItems: "center" }}>
              <h1 className="h-3 grad-text" style={{ fontWeight: 800 }}>Command Center</h1>
              <p className="eyebrow" style={{ fontSize: 10 }}>Restricted Access Portal</p>
            </div>
          </div>

          <div className="hr" />

          {errorMSG && (
            <div className="pill bad solid font-medium" style={{ display: "flex", width: "100%", justifyContent: "center", padding: "12px" }}>
              {errorMSG}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="col gap-4">
            <div className="col gap-2">
              <label className="eyebrow" style={{ fontSize: 9 }}>Admin Email</label>
              <div className="search" style={{ padding: "10px 14px 10px 18px" }}>
                <Mail size={16} style={{ color: "var(--ink-3)" }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cybermilo.com"
                  required
                />
              </div>
            </div>

            <div className="col gap-2">
              <label className="eyebrow" style={{ fontSize: 9 }}>Passkey</label>
              <div className="search" style={{ padding: "10px 14px 10px 18px" }}>
                <Lock size={16} style={{ color: "var(--ink-3)" }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passkey"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 8 }}
            >
              {loading ? 'Authorizing...' : 'Authorize Access'}
            </button>
          </form>

          <div className="hr" />

          <div className="row center">
            <Link href="/" className="btn btn-glass btn-sm">
              Back to Patient Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

