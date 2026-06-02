"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/super-admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div>
      <div className="atmos app-atmos" aria-hidden="true" />
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <TopBar />
          {children}
        </main>
      </div>
    </div>
  );
}

