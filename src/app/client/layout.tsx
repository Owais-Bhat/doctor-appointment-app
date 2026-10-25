import React from "react";
import { PortalShell } from "@/components/layout/PortalShell";

export const metadata = {
  title: "MedFlow - Patient Portal",
  description: "Book appointments, manage health records, and connect with healthcare providers",
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
