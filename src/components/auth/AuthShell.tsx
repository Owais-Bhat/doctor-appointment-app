"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Two-column sign-in layout: a quiet brand panel and the form. */
export function AuthShell({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  /** Short text shown in the brand panel on wide screens. */
  aside: { heading: string; points: string[] };
  children: React.ReactNode;
}) {
  return (
    <div className="au">
      <aside className="au-brand" aria-hidden="true">
        <Link href="/" className="logo au-logo" tabIndex={-1}>
          <span className="mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h3l2-5 4 10 2-5h5" />
            </svg>
          </span>
          <span>MedFlow</span>
        </Link>
        <div className="au-brand-body">
          <p className="au-brand-heading">{aside.heading}</p>
          <ul>
            {aside.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <svg className="au-pulse" viewBox="0 0 600 120" preserveAspectRatio="none">
          <path d="M0 60h170l26-44 40 92 30-70 22 22h312" />
        </svg>
      </aside>

      <main className="au-main">
        <Link href="/" className="logo au-mobile-logo" aria-label="MedFlow home">
          <span className="mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h3l2-5 4 10 2-5h5" />
            </svg>
          </span>
          <span>
            Med<span style={{ color: "var(--accent)" }}>Flow</span>
          </span>
        </Link>
        <div className="au-form">
          <div className="col gap-2">
            <h1 className="h-2">{title}</h1>
            {subtitle && <p className="body">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function Field({
  label,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: React.ReactNode }) {
  return (
    <label className="au-field">
      <span className="mf-label">{label}</span>
      <input className="input" {...input} />
      {hint && <span className="tiny">{hint}</span>}
    </label>
  );
}

export function PasswordField({
  label,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <label className="au-field">
      <span className="mf-label">{label}</span>
      <span className="au-pw">
        <input className="input" type={show ? "text" : "password"} {...input} />
        <button type="button" className="au-eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
      {hint && <span className="tiny">{hint}</span>}
    </label>
  );
}

export function GoogleButton({ onClick, disabled, label = "Continue with Google" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" className="btn btn-ghost au-google" onClick={onClick} disabled={disabled}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {label}
    </button>
  );
}

export function Divider() {
  return (
    <div className="au-or" role="separator">
      <span>or</span>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="bk-error" role="alert" style={{ position: "static" }}>
      {message}
    </p>
  );
}
