"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, updatePassword } from "firebase/auth";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { googleProvider } from "@/lib/firebase";
import { IS_DEMO_AUTH } from "@/lib/demo-auth";
import { authErrorMessage } from "@/lib/auth-flow";
import { FormError, PasswordField } from "@/components/auth/AuthShell";

/** The admin's own sign-in: change the password, or add one to a Google-only account. */
export default function AdminAccount() {
  const { user, displayName } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  // Becomes true after a Google-only account sets its first password
  const [addedPassword, setAddedPassword] = useState(false);

  const hasPassword = addedPassword || !!user?.providerData?.some((p) => p.providerId === "password");
  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = again.length > 0 && again !== next;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (next.length < 8) return setError("Use at least 8 characters for the new password.");
    if (next !== again) return setError("The two new passwords don’t match.");
    setBusy(true);
    setError("");
    setDone(false);
    try {
      // Firebase asks for a fresh sign-in before it changes a password
      if (hasPassword) await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
      else await reauthenticateWithPopup(user, googleProvider);
      await updatePassword(user, next);
      setAddedPassword(true);
      setCurrent("");
      setNext("");
      setAgain("");
      setDone(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "Your current password is not correct."
          : code === "auth/user-mismatch"
            ? "Choose the same Google account you are signed in with."
            : authErrorMessage(err),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dr hp">
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Account</h1>
          <p className="small">
            Signed in as {displayName ? `${displayName} · ` : ""}
            {user?.email}
          </p>
        </div>
      </header>

      <section className="hp-card" aria-labelledby="ac-pw" style={{ maxWidth: 520 }}>
        <h2 id="ac-pw" className="hp-title">
          <KeyRound size={16} /> {hasPassword ? "Change password" : "Set a password"}
        </h2>

        {IS_DEMO_AUTH ? (
          <p className="small">Passwords can’t be changed in the local demo. Connect Firebase to manage real sign-ins.</p>
        ) : (
          <form className="au-stack" onSubmit={onSubmit} noValidate>
            {hasPassword ? (
              <PasswordField label="Current password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
            ) : (
              <p className="small">
                You sign in with Google. Set a password to also sign in with your email on the admin sign-in page. You’ll be asked to confirm your Google account first.
              </p>
            )}
            <PasswordField
              label="New password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              aria-invalid={tooShort}
              hint={tooShort ? `${8 - next.length} more characters` : "At least 8 characters"}
            />
            <PasswordField
              label="New password again"
              autoComplete="new-password"
              required
              value={again}
              onChange={(e) => setAgain(e.target.value)}
              aria-invalid={mismatch}
              hint={mismatch ? "Doesn’t match yet" : undefined}
            />
            <FormError message={error} />
            {done && <p className="small" role="status">Password saved. Use it the next time you sign in.</p>}
            <button type="submit" className="btn btn-primary" disabled={busy || !user || !next || !again || (hasPassword && !current)}>
              {busy ? "Saving…" : hasPassword ? "Change password" : "Set password"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
