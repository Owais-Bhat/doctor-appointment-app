"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmail } from "@/lib/firebase";
import { afterSignIn, authErrorMessage } from "@/lib/auth-flow";
import { AuthShell, Field, FormError, PasswordField } from "@/components/auth/AuthShell";

const ASIDE = {
  heading: "MedFlow administration",
  points: ["Verify doctors", "Manage accounts", "Review the audit log"],
};

/**
 * Admin sign-in. Admin accounts are never created from this page:
 * an existing user is given the super_admin role in the database.
 */
function AdminLogin() {
  const { role, signOut, isLoading } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (role === "super_admin") router.replace(afterSignIn(role, next));
  }, [role, next, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (role && role !== "super_admin") {
    return (
      <AuthShell title="No admin access" subtitle="You’re signed in, but this account isn’t an administrator." aside={ASIDE}>
        <div className="row gap-2 wrap">
          <button type="button" className="btn btn-primary" onClick={() => router.replace(afterSignIn(role, null))}>
            Go to my account
          </button>
          <button type="button" className="btn btn-ghost" onClick={signOut}>
            Sign in with another account
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Admin sign in" subtitle="For MedFlow staff only." aside={ASIDE}>
      <form className="au-stack" onSubmit={onSubmit}>
        <Field label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormError message={error} />
        <button type="submit" className="btn btn-primary" disabled={busy || isLoading || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}
