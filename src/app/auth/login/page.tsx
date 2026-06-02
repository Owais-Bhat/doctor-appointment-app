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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 420, padding: 32, borderRadius: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="h-2" style={{ marginBottom: 8 }}>Welcome back</h1>
          <p className="body" style={{ color: "var(--ink-3)" }}>Sign in to manage your health journey</p>
        </div>

        {errorMSG && (
          <div style={{ padding: 12, marginBottom: 18, borderRadius: 12, background: "color-mix(in oklab, red 8%, transparent)", border: "1px solid color-mix(in oklab, red 20%, transparent)", fontSize: 13, color: "var(--bad)" }}>
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="col gap-3" style={{ marginBottom: 20 }}>
          <input
            type="email"
            placeholder="Official Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
          <button
            type="submit"
            disabled={isLoggingIn || isLoading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {isLoggingIn ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="row gap-3" style={{ marginBottom: 20, alignItems: "center" }}>
          <div style={{ height: 1, background: "var(--line)", flex: 1 }} />
          <span className="small" style={{ color: "var(--ink-3)" }}>or</span>
          <div style={{ height: 1, background: "var(--line)", flex: 1 }} />
        </div>

        <button
          onClick={handleGoogleSignIn}
          type="button"
          disabled={isLoading || isLoggingIn}
          className="btn btn-glass"
          style={{ width: "100%", justifyContent: "center", gap: 8 }}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} />
          Continue with Google
        </button>

        <div className="small" style={{ marginTop: 20, color: "var(--ink-3)" }}>
          New Patient? <a href="/auth/register" style={{ color: "var(--accent)" }}>Register here</a>
        </div>
      </div>
    </div>
  );
}
