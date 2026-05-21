"use client";

import { FileText, HeartPulse, ShieldCheck } from "lucide-react";
import { Headshot, PrototypePanel } from "@/components/medflow/Prototype";

export default function ClientProfile() {
  return (
    <div className="fade-enter col gap-7">
      <div className="glass-strong" style={{ padding: 28 }}>
        <div className="row gap-5">
          <Headshot name="Maya Rivera" hue={30} size={96} />
          <div className="grow">
            <div className="eyebrow">Patient record</div>
            <h1 className="h-1">Maya Rivera</h1>
            <p className="body">Encrypted profile, emergency contacts, insurance, consent, and medical timeline.</p>
          </div>
          <span className="pill good"><ShieldCheck size={11} /> Verified</span>
        </div>
      </div>
      <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <PrototypePanel icon={HeartPulse} eyebrow="Vitals" title="Health stats"><p className="small">BP 118/76 · HR 68 · A1C 5.4 · Sleep 7h 20m</p></PrototypePanel>
        <PrototypePanel icon={FileText} eyebrow="Records" title="Medical records"><p className="small">18 documents, 4 prescriptions, 2 lab panels, 1 imaging report.</p></PrototypePanel>
        <PrototypePanel icon={ShieldCheck} eyebrow="Privacy" title="Consent controls"><p className="small">HIPAA/GDPR/CCPA access logs and sharing preferences are active.</p></PrototypePanel>
      </div>
    </div>
  );
}
