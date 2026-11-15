"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmail } from "@/lib/firebase";
import { IS_DEMO_AUTH } from "@/lib/demo-auth";
import { afterSignIn, authErrorMessage } from "@/lib/auth-flow";
import { AuthShell, Divider, Field, FormError, GoogleButton, PasswordField } from "@/components/auth/AuthShell";

const ASIDE = {
  heading: "MedFlow administration",
  points: ["Verify doctors", "Manage accounts", "Review the audit log"],
};

/**
 * Admin sign-in. Admin accounts are never created from this page: the role
 * is given in the database (mysql/seed-super-admin.sql reserves it for one
 * email, which must be verified before the role is handed over).
 */
function AdminLogin() {
  const { user, role, signIn, signOut, isLoading } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") return;

    const dest = afterSignIn(role, next);
    if (!dest || typeof dest !== "string") return;

    const lastRedirectKey = 'medflow_admin_last_redirect';
    const lastRedirect = typeof window !== 'undefined' ? sessionStorage.getItem(lastRedirectKey) : null;
    const now = Date.now();

    if (lastRedirect) {
      try {
        const { url, time } = JSON.parse(lastRedirect);
        if (url === dest && now - time < 4000) {
          console.warn('Prevented admin redirect loop to:', dest);
          return;
        }
      } catch {}
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(lastRedirectKey, JSON.stringify({ url: dest, time: now }));
      window.location.href = dest;
    }
  }, [role, next]);

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

  const google = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendLink = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // After the link is opened, a fresh token carries the verified address
  const recheck = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      await user.reload();
      if (!user.emailVerified) return setError("That address isn’t verified yet. Open the link in the email first.");
      await user.getIdToken(true);
      window.location.reload();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (role && role !== "super_admin") {
    const unverified = !IS_DEMO_AUTH && !!user && !user.emailVerified;
    return (
      <AuthShell title="No admin access" subtitle="You’re signed in, but this account isn’t an administrator." aside={ASIDE}>
        {unverified && (
          <div className="au-stack" style={{ marginBottom: 16 }}>
            <p className="small">
              If {user.email} was set up as the administrator, confirm the address is yours first. We’ll email you a link.
            </p>
            <div className="row gap-2 wrap">
              <button type="button" className="btn btn-ghost" onClick={sendLink} disabled={busy}>
                {sent ? "Send the link again" : "Email me a verification link"}
              </button>
              {sent && (
                <button type="button" className="btn btn-ghost" onClick={recheck} disabled={busy}>
                  I’ve opened the link
                </button>
              )}
            </div>
            <FormError message={error} />
          </div>
        )}
        <div className="row gap-2 wrap">
          <button type="button" className="btn btn-primary" onClick={() => { window.location.href = afterSignIn(role, null); }}>
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
      <GoogleButton onClick={google} disabled={busy || isLoading} />
      <Divider />
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
