"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

const NAVIGATION: Record<string, NavItem[]> = {
  patient: [
    { title: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
    { title: 'Book Appointment', href: '/client/book', icon: Calendar },
    { title: 'My Appointments', href: '/client/appointments', icon: Calendar },
    { title: 'Doctors', href: '/client/doctors', icon: Users },
    { title: 'Profile', href: '/client/profile', icon: User },
    { title: 'Notifications', href: '/client/notifications', icon: Bell },
  ],
  doctor: [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Appointments', href: '/admin/appointments', icon: Calendar },
    { title: 'Schedule', href: '/admin/schedule', icon: Settings },
    { title: 'Patients', href: '/admin/patients', icon: Users },
    { title: 'Analytics', href: '/admin/analytics', icon: LayoutDashboard },
    { title: 'Profile', href: '/admin/profile', icon: User },
  ],
  super_admin: [
    { title: 'Command Center', href: '/super-admin/dashboard', icon: LayoutDashboard },
  ],
};

export function Sidebar() {
  const { role, user, signOut } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!role) return null;

  const navItems = NAVIGATION[role] || [];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-surface-100 border-r border-surface-300 transition-all duration-300 z-50",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="flex items-center justify-between p-6 h-16 border-b border-surface-300">
        {!collapsed && <span className="font-bold text-xl text-brand-primary">MediFlow</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-surface-200 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center p-3 rounded-xl transition-all duration-200 group",
              pathname === item.href
                ? "bg-brand-primary text-white shadow-md"
                : "text-gray-500 hover:bg-surface-200 hover:text-brand-primary"
            )}
          >
            <item.icon size={22} className={cn("shrink-0", !collapsed && "mr-3")} />
            {!collapsed && <span className="font-medium">{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-surface-300">
        <button
          onClick={signOut}
          className="flex items-center w-full p-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={22} className={cn("shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
