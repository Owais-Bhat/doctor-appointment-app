import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
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
