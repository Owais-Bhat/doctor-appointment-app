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
    <div className="min-h-screen flex items-center justify-center bg-surface-200">
      <div className="bg-surface-100 p-8 rounded-3xl shadow-xl border border-surface-300 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-brand-primary mb-2">Create Account</h1>
        <p className="text-gray-500 mb-8">Join MedFlow for better healthcare</p>

        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-surface-200 border border-surface-300 focus:ring-2 focus:ring-brand-primary outline-none"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-surface-200 border border-surface-300 focus:ring-2 focus:ring-brand-primary outline-none"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-surface-200 border border-surface-300 focus:ring-2 focus:ring-brand-primary outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white p-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/auth/login" className="text-brand-primary font-semibold">Login here</a>
        </div>
      </div>
    </div>
  );
}
