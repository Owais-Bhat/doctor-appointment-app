import {
  Activity,
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  FileClock,
  Home,
  Settings,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Portal = "patient" | "doctor" | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown in the mobile tab bar (max 5 per portal). */
  tab?: boolean;
  /** Rendered as the raised centre button in the mobile tab bar. */
  primary?: boolean;
};

export const NAV: Record<Portal, { name: string; home: string; notifications: string | null; items: NavItem[] }> = {
  patient: {
    name: "Patient",
    home: "/client/dashboard",
    notifications: "/client/notifications",
    items: [
      { label: "Home", href: "/client/dashboard", icon: Home, tab: true },
      { label: "Visits", href: "/client/appointments", icon: CalendarCheck, tab: true },
      { label: "Book a visit", href: "/client/book", icon: CalendarPlus, tab: true, primary: true },
      { label: "Doctors", href: "/client/doctors", icon: Stethoscope, tab: true },
      { label: "Notifications", href: "/client/notifications", icon: Bell },
      { label: "Health profile", href: "/client/profile", icon: UserRound, tab: true },
    ],
  },
  doctor: {
    name: "Clinic",
    home: "/admin/dashboard",
    notifications: "/admin/notifications",
    items: [
      { label: "Today", href: "/admin/dashboard", icon: Home, tab: true },
      { label: "Schedule", href: "/admin/schedule", icon: CalendarDays, tab: true },
      { label: "Appointments", href: "/admin/appointments", icon: CalendarCheck, tab: true },
      { label: "Patients", href: "/admin/patients", icon: Users, tab: true },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Analytics", href: "/admin/analytics", icon: Activity },
      { label: "Profile", href: "/admin/profile", icon: Settings, tab: true },
    ],
  },
  admin: {
    name: "Admin",
    home: "/super-admin/dashboard",
    notifications: null,
    items: [
      { label: "Overview", href: "/super-admin/dashboard", icon: Home, tab: true },
      { label: "Doctors", href: "/super-admin/doctors", icon: Stethoscope, tab: true },
      { label: "Users", href: "/super-admin/users", icon: Users, tab: true },
      { label: "Analytics", href: "/super-admin/analytics", icon: Activity, tab: true },
      { label: "Audit log", href: "/super-admin/audit-logs", icon: FileClock, tab: true },
    ],
  },
};

export function portalFor(pathname: string): Portal {
  if (pathname.startsWith("/client")) return "patient";
  if (pathname.startsWith("/super-admin")) return "admin";
  return "doctor";
}

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The nav item for the current page, used for the page label. */
export function currentItem(pathname: string): NavItem | undefined {
  const items = NAV[portalFor(pathname)].items;
  return [...items].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href));
}
