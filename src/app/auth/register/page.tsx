"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { registerWithEmail } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";

export default function RegisterPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === "doctor") router.push("/admin/dashboard");
    if (role === "patient") router.push("/client/dashboard");
    if (role === "super_admin") router.push("/super-admin/dashboard");
  }, [role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cred = await registerWithEmail(email.trim(), password);
      await updateProfile(cred.user, { displayName: fullName.trim() });
      const token = await cred.user.getIdToken();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName: fullName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Registration failed");
      }

      router.push("/client/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 16 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 420, padding: 32, borderRadius: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="h-2" style={{ marginBottom: 8 }}>Create Account</h1>
          <p className="body" style={{ color: "var(--ink-3)" }}>Join MedFlow for better healthcare</p>
        </div>

        {error && (
          <div style={{ padding: 12, marginBottom: 18, borderRadius: 12, background: "color-mix(in oklab, red 8%, transparent)", border: "1px solid color-mix(in oklab, red 20%, transparent)", fontSize: 13, color: "var(--bad)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="col gap-3" style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="input"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="input"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="input"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <div className="small" style={{ color: "var(--ink-3)" }}>
          Already have an account?{" "}
          <a href="/auth/login" style={{ color: "var(--accent)" }}>Login here</a>
        </div>
      </div>
    </div>
  );
}
