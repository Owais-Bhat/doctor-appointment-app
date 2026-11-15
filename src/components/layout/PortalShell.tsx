"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, LogOut, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NAV, currentItem, isActive, portalFor } from "./nav";

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="logo" aria-label="MedFlow home">
      <span className="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h3l2-5 4 10 2-5h5" />
        </svg>
      </span>
      <span>
        Med<span style={{ color: "var(--accent)" }}>Flow</span>
      </span>
    </Link>
  );
}

function UserBadge({ size = 32 }: { size?: number }) {
  const { displayName, user } = useAuth();
  const name = displayName || user?.email || "";
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function Sidebar({ onSignOutRequest }: { onSignOutRequest: () => void }) {
  const pathname = usePathname();
  const portal = NAV[portalFor(pathname)];
  const { displayName, user } = useAuth();

  return (
    <aside className="sidebar mf-sidebar" aria-label={`${portal.name} navigation`}>
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <Logo href={portal.home} />
        <span className="mf-portal-tag">{portal.name}</span>
      </div>

      <nav className="col" style={{ gap: 2, marginTop: 8 }}>
        {portal.items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", active && "active")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mf-sidebar-user">
        <UserBadge />
        <div className="grow col" style={{ gap: 0 }}>
          <span className="mf-ellipsis" style={{ fontWeight: 600, fontSize: 13.5 }}>
            {displayName || "Signed in"}
          </span>
          <span className="mf-ellipsis tiny">{user?.email}</span>
        </div>
        <button className="icon-btn" onClick={onSignOutRequest} aria-label="Sign out" title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
      <nav className="mf-sidebar-legal" aria-label="Help and policies">
        <Link href="/contact">Help</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </aside>
  );
}

function PageHeader({ onSignOutRequest }: { onSignOutRequest: () => void }) {
  const pathname = usePathname();
  const portal = NAV[portalFor(pathname)];
  const label = currentItem(pathname)?.label ?? (pathname.includes("/visit/") ? "Video visit" : undefined);

  return (
    <header className="mf-header">
      {/* Mobile: logo. Desktop: current page name. */}
      <div className="mf-header-mobile-logo">
        <Logo href={portal.home} />
      </div>
      <span className="mf-header-label">{label}</span>
      <div className="row gap-2" style={{ marginLeft: "auto", alignItems: "center" }}>
        {portal.notifications && (
          <Link href={portal.notifications} className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </Link>
        )}
        <span className="mf-header-avatar">
          <UserBadge size={30} />
        </span>
        <button className="icon-btn mf-header-signout" onClick={onSignOutRequest} aria-label="Sign out">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

function SignOutDialog({
  open,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mf-signout-backdrop"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onCancel();
          }}
        >
          <motion.div
            className="mf-signout-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            aria-describedby="signout-copy"
            initial={reduce ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <button className="mf-signout-close" onClick={onCancel} disabled={busy} aria-label="Close">
              <X size={18} />
            </button>
            <span className="mf-signout-icon" aria-hidden="true"><LogOut size={23} /></span>
            <div>
              <p className="mf-signout-kicker"><ShieldCheck size={14} /> Secure session</p>
              <h2 id="signout-title">Sign out of MedFlow?</h2>
              <p id="signout-copy">You’ll need to sign in again to open your dashboard and health information.</p>
            </div>
            {error && <p className="mf-signout-error" role="alert">{error}</p>}
            <div className="mf-signout-actions">
              <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Stay signed in</button>
              <button type="button" className="btn mf-signout-confirm" onClick={onConfirm} disabled={busy}>
                {busy ? "Signing out…" : "Yes, sign out"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabBar() {
  const pathname = usePathname();
  const tabs = NAV[portalFor(pathname)].items.filter((i) => i.tab).slice(0, 5);

  return (
    <nav className="mf-tabbar" aria-label="Main">
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("mf-tab", active && "active", item.primary && "primary")}
            aria-current={active ? "page" : undefined}
          >
            <span className="mf-tab-icon">
              <Icon size={item.primary ? 22 : 20} strokeWidth={active || item.primary ? 2.2 : 1.8} />
            </span>
            <span className="mf-tab-label">{item.primary ? "Book" : item.label.replace("Health profile", "Profile")}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Sidebar on desktop; header + bottom tab bar on mobile. Used by all three portals. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { signOut } = useAuth();
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const portal = portalFor(pathname);

  const closeSignOut = () => {
    if (signingOut) return;
    setShowSignOut(false);
    setSignOutError("");
  };

  const confirmSignOut = async () => {
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
      router.replace(portal === "admin" ? "/super-admin/login" : "/auth/login");
      router.refresh();
    } catch {
      setSignOutError("We couldn’t sign you out. Please try again.");
      setSigningOut(false);
    }
  };

  return (
    <div>
      <div className="atmos app-atmos" aria-hidden="true" />
      <a href="#main" className="mf-skip">Skip to content</a>
      <div className="app-shell">
        <Sidebar onSignOutRequest={() => setShowSignOut(true)} />
        <main id="main" className="main">
          <PageHeader onSignOutRequest={() => setShowSignOut(true)} />
          <motion.div
            key={pathname}
            className="mf-page-transition"
            initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <TabBar />
      <SignOutDialog
        open={showSignOut}
        busy={signingOut}
        error={signOutError}
        onCancel={closeSignOut}
        onConfirm={confirmSignOut}
      />
    </div>
  );
}
