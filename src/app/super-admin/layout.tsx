"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PortalShell } from "@/components/layout/PortalShell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/super-admin/login") return <>{children}</>;
  return <PortalShell>{children}</PortalShell>;
}
