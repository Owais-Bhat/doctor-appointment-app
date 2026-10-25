"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendPasswordReset, signInWithEmail } from "@/lib/firebase";
import { afterSignIn, authErrorMessage } from "@/lib/auth-flow";
import { AuthShell, Divider, Field, FormError, GoogleButton, PasswordField } from "@/components/auth/AuthShell";

const ASIDE = {
  heading: "Your doctor, a few taps away.",
  points: ["Book video, phone or clinic visits", "Get notified the moment your doctor confirms", "Keep your health details in one place"],
};

function Login() {
  const { signIn, role, isLoading } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");

  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Signed in (now or already): go to the page they came for, or their home
  useEffect(() => {
    if (role) router.replace(afterSignIn(role, next));
  }, [role, next, router]);

  const withBusy = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    withBusy(() => signInWithEmail(email.trim(), password));
  };

  const onReset = (e: React.FormEvent) => {
    e.preventDefault();
    withBusy(async () => {
      await sendPasswordReset(email.trim());
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox and spam folder.`);
    });
  };

  if (role) {
    return (
      <AuthShell title="Signing you in…" aside={ASIDE}>
        <p className="small">Taking you to your account.</p>
      </AuthShell>
    );
  }

  if (mode === "reset") {
    return (
      <AuthShell title="Reset your password" subtitle="We’ll email you a link to choose a new one." aside={ASIDE}>
        <form className="au-stack" onSubmit={onReset}>
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormError message={error} />
          {notice && <p className="au-notice" role="status">{notice}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || !email}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <button type="button" className="au-link" onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle={next ? "Sign in to continue where you left off." : "Welcome back to MedFlow."} aside={ASIDE}>
      <GoogleButton onClick={() => withBusy(signIn)} disabled={busy || isLoading} />
      <Divider />
      <form className="au-stack" onSubmit={onSignIn}>
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="au-link au-forgot" onClick={() => { setMode("reset"); setError(""); }}>
          Forgot password?
        </button>
        <FormError message={error} />
        <button type="submit" className="btn btn-primary" disabled={busy || isLoading || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="small au-switch">
        New to MedFlow? <Link href={next ? `/auth/register?next=${encodeURIComponent(next)}` : "/auth/register"}>Create an account</Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
