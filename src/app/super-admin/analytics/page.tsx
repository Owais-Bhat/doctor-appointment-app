"use client";

import { BarChart3, Brain, FileCheck2, TrendingUp } from "lucide-react";
import { PrototypePanel, StatGrid } from "@/components/medflow/Prototype";

export default function SuperAdminAnalytics() {
  return (
    <div className="fade-enter col gap-7">
      <div><div className="eyebrow">Platform analytics</div><h1 className="h-1">BI and forecasting</h1><p className="body">Revenue cycle, benchmarks, AI optimization, quality measures, and enterprise reporting.</p></div>
      <StatGrid items={[{ label: "ARR", value: "$8.4M", detail: "+31%" }, { label: "Claims", value: "94%", detail: "clean" }, { label: "No-show", value: "-18%", detail: "AI" }, { label: "Regions", value: "12", detail: "ready" }]} />
      <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <PrototypePanel icon={BarChart3} eyebrow="Reports" title="Custom BI builder"><p className="small">Drag-and-drop clinical, financial, and operational reporting across clinics.</p></PrototypePanel>
        <PrototypePanel icon={Brain} eyebrow="AI" title="Forecasting engine"><p className="small">Capacity, churn, no-show, and revenue forecasts drive proactive operations.</p></PrototypePanel>
        <PrototypePanel icon={FileCheck2} eyebrow="Quality" title="CQM/HEDIS"><p className="small">Quality measures and disease registry exports are audit ready.</p></PrototypePanel>
      </div>
      <div className="glass" style={{ padding: 24 }}><div className="row gap-3"><TrendingUp style={{ color: "var(--accent)" }} /><div><div className="h-3">Enterprise insight</div><p className="body">Open 11 optimized telehealth slots next week to increase revenue by $14.2k while keeping wait time under 8 minutes.</p></div></div></div>
    </div>
  );
}
