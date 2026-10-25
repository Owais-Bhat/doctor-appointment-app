"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { auth, signInWithGoogle, signOutFirebase } from "@/lib/firebase";
import type { User } from "firebase/auth";

type UserRole = 'patient' | 'doctor' | 'super_admin';

type AuthCtx = {
  user: User | null;
  role: UserRole | null;
  /** Name from the MedFlow profile, falling back to the sign-in provider's name. */
  displayName: string | null;
  isLoading: boolean;
  signIn: () => Promise<unknown>;
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
  const [profileName, setProfileName] = useState<string | null>(null);
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
          // Set the signed role cookie first, so pages the user is sent to
          // next aren't bounced back to sign-in by the proxy
          await setSessionCookie(token, activeRole);
          setProfileName(profile?.full_name ?? null);
          setRole(activeRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole('patient');
        }
      } else {
        setRole(null);
        setProfileName(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const handleSignOut = async () => {
    await signOutFirebase();
    setUser(null);
    setRole(null);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      user, role, displayName: profileName ?? user?.displayName ?? null, isLoading, signIn: signInWithGoogle, signOut: handleSignOut, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
