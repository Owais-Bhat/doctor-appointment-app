import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL, missingLegalDetails } from "@/lib/legal";
import { LegalLinks } from "./LegalLinks";
import { LegalNav } from "./LegalNav";

function Logo() {
  return (
    <Link href="/" className="logo lp-logo" aria-label="MedFlow home">
      <span className="mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12h3l2-5 4 10 2-5h5" />
        </svg>
      </span>
      <span>Med<span style={{ color: "var(--accent)" }}>Flow</span></span>
    </Link>
  );
}

export type Section = { id: string; title: string; body: ReactNode };

/** Page frame for the public policy pages: header, page list, article, footer. */
export function LegalShell({
  title,
  intro,
  sections,
  children,
  showUpdated = true,
}: {
  title: string;
  intro?: ReactNode;
  sections?: Section[];
  children?: ReactNode;
  showUpdated?: boolean;
}) {
  const missing = process.env.NODE_ENV !== "production" ? missingLegalDetails() : [];
  return (
    <div className="lg">
      <a href="#lg-main" className="mf-skip">Skip to content</a>
      <header className="lg-top">
        <div className="lg-wrap lg-top-in">
          <Logo />
          <div className="row gap-2">
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Book a visit</Link>
          </div>
        </div>
      </header>

      <div className="lg-wrap lg-body">
        <LegalNav />
        <main id="lg-main" className="lg-main">
          {missing.length > 0 && (
            <p className="lg-missing" role="note">
              <b>Before going live:</b> set {missing.join(", ")} in your environment so these pages show your real business details. (This note only appears in development.)
            </p>
          )}
          <article className="lg-article">
            <h1 className="lg-title">{title}</h1>
            {showUpdated && <p className="lg-updated">Last updated {LEGAL.updated}</p>}
            {intro && <div className="lg-intro">{intro}</div>}

            {sections && sections.length > 3 && (
              <nav className="lg-toc" aria-label="On this page">
                <span className="mf-label">On this page</span>
                <ol>
                  {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
                </ol>
              </nav>
            )}

            {sections?.map((s) => (
              <section key={s.id} id={s.id} className="lg-section" aria-labelledby={`${s.id}-h`}>
                <h2 id={`${s.id}-h`}>{s.title}</h2>
                {s.body}
              </section>
            ))}
            {children}
          </article>
        </main>
      </div>

      <footer className="lg-foot">
        <div className="lg-wrap lg-foot-in">
          <LegalLinks className="lg-foot-links" />
          <p className="tiny">
            © {new Date().getFullYear()} {(LEGAL.legalName ?? LEGAL.brand).replace(/\.$/, "")}. MedFlow helps you book doctors; it does not provide emergency care. In an emergency, call 112.
          </p>
        </div>
      </footer>
    </div>
  );
}
