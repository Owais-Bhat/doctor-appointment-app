"use client";

import { CreditCard, Globe2, KeyRound, ServerCog } from "lucide-react";
import { PrototypePanel } from "@/components/medflow/Prototype";

export default function SettingsPage() {
  return (
    <div className="fade-enter col gap-7">
      <div><div className="eyebrow">Plans and platform</div><h1 className="h-1">Enterprise settings</h1></div>
      <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <PrototypePanel icon={CreditCard} eyebrow="Billing" title="Plans"><p className="small">Starter, Pro, Enterprise, and white-label marketplace billing.</p></PrototypePanel>
        <PrototypePanel icon={KeyRound} eyebrow="SSO" title="SAML/OAuth"><p className="small">Enterprise identity providers, SCIM, role provisioning, and session policy.</p></PrototypePanel>
        <PrototypePanel icon={Globe2} eyebrow="Regions" title="Data residency"><p className="small">Regional storage policies and compliance controls.</p></PrototypePanel>
        <PrototypePanel icon={ServerCog} eyebrow="Infrastructure" title="Scale controls"><p className="small">CDN, sharding, backups, DR, and uptime monitors.</p></PrototypePanel>
      </div>
    </div>
  );
}
