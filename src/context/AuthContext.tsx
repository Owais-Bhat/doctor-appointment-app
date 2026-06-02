"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, signInWithGoogle, signOutFirebase } from "@/lib/firebase";
import type { User } from "firebase/auth";

type UserRole = 'patient' | 'doctor' | 'super_admin';

type AuthCtx = {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function setSessionCookie(token: string, role: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  }).catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { profile } = await res.json();
          const activeRole = (profile?.role ?? 'patient') as UserRole;
          setRole(activeRole);
          await setSessionCookie(token, activeRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('patient');
        }
      } else {
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  };

  const handleSignOut = async () => {
    await signOutFirebase();
    setUser(null);
    setRole(null);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      user, role, isLoading, signIn: signInWithGoogle, signOut: handleSignOut, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
