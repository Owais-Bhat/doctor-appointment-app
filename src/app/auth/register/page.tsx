"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { registerWithEmail } from "@/lib/firebase";
import { afterSignIn, authErrorMessage } from "@/lib/auth-flow";
import { AuthShell, Divider, Field, FormError, GoogleButton, PasswordField } from "@/components/auth/AuthShell";

const ASIDE = {
  heading: "Care that fits around your day.",
  points: ["Free for patients", "See real open times before you book", "Video visits from home"],
};

function Register() {
  const { signIn, role, isLoading } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (role) router.replace(afterSignIn(role, next));
  }, [role, next, router]);

  const tooShort = password.length > 0 && password.length < 8;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your full name.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setBusy(true);
    setError("");
    try {
      const cred = await registerWithEmail(email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: await cred.user.getIdToken(), fullName: name.trim() }),
      });
      if (!res.ok) throw new Error("profile");
      // AuthContext picks up the new session and the effect above redirects
    } catch (err) {
      setError((err as Error).message === "profile" ? "Your account was created, but saving your name failed. Sign in to continue." : authErrorMessage(err));
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

  return (
    <AuthShell title="Create your account" subtitle="Book your first visit in a couple of minutes." aside={ASIDE}>
      <GoogleButton onClick={google} disabled={busy || isLoading} label="Sign up with Google" />
      <Divider />
      <form className="au-stack" onSubmit={onSubmit} noValidate>
        <Field label="Full name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={tooShort}
          hint={tooShort ? `${8 - password.length} more characters` : "At least 8 characters"}
        />
        <FormError message={error} />
        <button type="submit" className="btn btn-primary" disabled={busy || isLoading || !name || !email || !password}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="tiny">By creating an account you agree to MedFlow’s terms and privacy policy.</p>
      </form>
      <p className="small au-switch">
        Already have an account? <Link href={next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"}>Sign in</Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <Register />
    </Suspense>
  );
}
