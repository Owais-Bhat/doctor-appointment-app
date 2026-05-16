"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, signInWithGoogle, signOutFirebase, db } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { createClient } from "@/lib/supabase";

type UserRole = 'patient' | 'doctor' | 'super_admin';

type AuthCtx = {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
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
          const supabase = createClient();
          const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', firebaseUser.uid)
            .single();

          if (data?.role) {
            // Hotfix: Force override if they logged in with the official super admin email
            const activeRole = firebaseUser.email === 'admin@cybermilo.com' ? 'super_admin' : data.role;
            setRole(activeRole as UserRole);
            document.cookie = `userRole=${activeRole}; path=/`;

            // Opportunistically patch DB if it was wrong
            if (activeRole === 'super_admin' && data.role !== 'super_admin') {
              await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', firebaseUser.uid);
            }
          } else {
            // Check Firestore whitelist for doctor role
            const { doc, getDoc } = await import('firebase/firestore');
            const whitelistDoc = await getDoc(doc(db, 'whitelisted_doctors', firebaseUser.email!.toLowerCase()));
            const isWhitelisted = whitelistDoc.exists();

            const initialRole = firebaseUser.email === 'admin@cybermilo.com' ? 'super_admin' : (isWhitelisted ? 'doctor' : 'patient');
            
            await supabase.from('profiles').insert({
              id: firebaseUser.uid,
              full_name: firebaseUser.displayName || (initialRole === 'super_admin' ? 'Super Admin' : 'New User'),
              email: firebaseUser.email!,
              role: initialRole
            });

            if (initialRole === 'doctor') {
              // Create the entry in doctor_profiles now that they have their own session
              await supabase.from('doctor_profiles').insert({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Dr. New Provider',
                specialty: 'General Practice',
                consultation_fee: 100,
                is_verified: true
              });
            }

            setRole(initialRole as UserRole);
            document.cookie = `userRole=${initialRole}; path=/`;
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutFirebase();
    setUser(null);
    setRole(null);
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <AuthContext.Provider value={{
      user, role, isLoading, signIn: signInWithGoogle, signOut: handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}
