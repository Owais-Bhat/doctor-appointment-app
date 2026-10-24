import React from "react";
import { PortalShell } from "@/components/layout/PortalShell";

export const metadata = {
  title: "MedFlow - Doctor Portal",
  description: "Manage appointments, patient consultations, and practice analytics",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
