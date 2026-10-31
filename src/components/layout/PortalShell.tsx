"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
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

function Sidebar() {
  const pathname = usePathname();
  const portal = NAV[portalFor(pathname)];
  const { displayName, user, signOut } = useAuth();

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
        <button className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
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

function PageHeader({ menuOpen, onMenuToggle, menuButtonRef }: { menuOpen: boolean; onMenuToggle: () => void; menuButtonRef: React.RefObject<HTMLButtonElement | null> }) {
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
        <button
          ref={menuButtonRef}
          className="icon-btn mf-menu-trigger"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mf-mobile-menu"
          onClick={onMenuToggle}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        {portal.notifications && (
          <Link href={portal.notifications} className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </Link>
        )}
        <span className="mf-header-avatar">
          <UserBadge size={30} />
        </span>
      </div>
    </header>
  );
}

function MobileMenu({ onClose, closeButtonRef, panelRef }: { onClose: () => void; closeButtonRef: React.RefObject<HTMLButtonElement | null>; panelRef: React.RefObject<HTMLElement | null> }) {
  const pathname = usePathname();
  const portal = NAV[portalFor(pathname)];
  const { displayName, user, signOut } = useAuth();

  return (
    <div className="mf-menu-layer" id="mf-mobile-menu">
      <button className="mf-menu-backdrop" type="button" aria-label="Close menu" onClick={onClose} />
      <aside ref={panelRef} className="mf-menu-panel" role="dialog" aria-modal="true" aria-label={`${portal.name} menu`}>
        <div className="mf-menu-heading">
          <div className="col gap-1">
            <span className="eyebrow">{portal.name} workspace</span>
            <strong className="mf-ellipsis">{displayName || user?.email || "Your account"}</strong>
          </div>
          <button ref={closeButtonRef} className="icon-btn" type="button" aria-label="Close menu" onClick={onClose}><X size={18} /></button>
        </div>
        <nav className="mf-menu-links" aria-label={`${portal.name} pages`}>
          {portal.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return <Link key={item.href} href={item.href} onClick={onClose} className={cn("nav-item", active && "active")} aria-current={active ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
            </Link>;
          })}
        </nav>
        <div className="mf-menu-footer">
          <nav aria-label="Help and policies"><Link href="/contact" onClick={onClose}>Help</Link><Link href="/privacy" onClick={onClose}>Privacy</Link><Link href="/terms" onClick={onClose}>Terms</Link></nav>
          <button type="button" className="mf-menu-signout" onClick={() => { onClose(); void signOut(); }}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>
    </div>
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
  const [openPath, setOpenPath] = useState<string | null>(null);
  const pathname = usePathname();
  const menuOpen = openPath === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenPath(null); menuButtonRef.current?.focus(); }
      if (event.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div>
      <div className="atmos app-atmos" aria-hidden="true" />
      <a href="#main" className="mf-skip">Skip to content</a>
      <div className="app-shell">
        <Sidebar />
        <main id="main" className="main">
          <PageHeader menuOpen={menuOpen} onMenuToggle={() => setOpenPath(menuOpen ? null : pathname)} menuButtonRef={menuButtonRef} />
          {children}
        </main>
      </div>
      <TabBar />
      {menuOpen && <MobileMenu onClose={() => { setOpenPath(null); menuButtonRef.current?.focus(); }} closeButtonRef={closeButtonRef} panelRef={panelRef} />}
    </div>
  );
}
