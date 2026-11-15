"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { auth, signInWithGoogle, signOutFirebase } from "@/lib/firebase";
import { DEMO_AUTH_EVENT, getDemoUser, IS_DEMO_AUTH } from "@/lib/demo-auth";
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
    if (IS_DEMO_AUTH) {
      const syncDemoUser = async () => {
        const demoUser = getDemoUser();
        setUser(demoUser as unknown as User | null);
        if (!demoUser) {
          setRole(null);
          setProfileName(null);
          setIsLoading(false);
          return;
        }

        try {
          const token = await demoUser.getIdToken();
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Unable to load demo profile');
          const { profile } = await res.json();
          const activeRole = (profile?.role ?? 'patient') as UserRole;
          await setSessionCookie(token, activeRole);
          setProfileName(profile?.full_name ?? demoUser.displayName);
          setRole(activeRole);
        } catch (error) {
          console.error("Error fetching demo user role:", error);
          setRole(null);
          setProfileName(null);
        } finally {
          setIsLoading(false);
        }
      };

      void syncDemoUser();
      window.addEventListener(DEMO_AUTH_EVENT, syncDemoUser);
      return () => window.removeEventListener(DEMO_AUTH_EVENT, syncDemoUser);
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          let activeRole: UserRole = 'patient';
          let name: string | null = null;

          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              activeRole = (data.profile?.role ?? 'patient') as UserRole;
              name = data.profile?.full_name ?? null;
            }
          } catch (e) {
            console.error("Error fetching /api/auth/me:", e);
          }

          // Set the signed role cookie so the proxy allows access to dashboard
          await setSessionCookie(token, activeRole);
          setProfileName(name);
          setRole(activeRole);
        } catch (error) {
          console.error("Error setting up user session:", error);
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
    try {
      await signOutFirebase();
    } finally {
      setUser(null);
      setRole(null);
      setProfileName(null);
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{
      user, role, displayName: profileName ?? user?.displayName ?? null, isLoading, signIn: signInWithGoogle, signOut: handleSignOut, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
