"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
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

function PageHeader() {
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
      </div>
    </header>
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
  return (
    <div>
      <div className="atmos app-atmos" aria-hidden="true" />
      <a href="#main" className="mf-skip">Skip to content</a>
      <div className="app-shell">
        <Sidebar />
        <main id="main" className="main">
          <PageHeader />
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
