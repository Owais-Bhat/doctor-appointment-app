"use client";

import { useState } from "react";
import { Activity, FileText, HeartPulse, MessageCircle, Search, ShieldCheck, Stethoscope, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { patients } from "@/lib/medflow-data";
import { cn } from "@/lib/utils";

export default function PatientsPage() {
  const [selected, setSelected] = useState(patients[0]);
  const [query, setQuery] = useState("");
  const filtered = patients.filter((patient) =>
    `${patient.name} ${patient.condition} ${patient.payer}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Longitudinal care</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">Patient command record</h1>
          <p className="mt-2 text-sm text-slate-600">Clinical timeline, outcomes, care gaps, insurance, and engagement in one record.</p>
        </div>
        <div className="flex w-full rounded-md border border-slate-200 bg-white lg:w-96">
          <Search className="ml-3 mt-3 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patients"
            className="min-w-0 flex-1 rounded-md border-0 px-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="med-card overflow-hidden">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Condition</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Payer</th>
                <th className="px-5 py-3">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((patient) => (
                <tr
                  key={patient.name}
                  onClick={() => setSelected(patient)}
                  className={cn("cursor-pointer bg-white hover:bg-blue-50/50", selected.name === patient.name && "bg-blue-50")}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
                        {patient.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.age} years old, last visit {patient.lastVisit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{patient.condition}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{patient.risk}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{patient.payer}</td>
                  <td className="px-5 py-4 font-semibold text-blue-700">{patient.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="space-y-5">
          <div className="med-card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-blue-600 text-lg font-bold text-white">
                {selected.name.split(" ").map((part) => part[0]).join("")}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">{selected.name}</h2>
                <p className="text-sm text-slate-500">{selected.condition}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{selected.payer}</span>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Consent active</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Metric label="BP" value="128/82" />
              <Metric label="A1C" value="6.8" />
              <Metric label="Risk" value={selected.risk} />
            </div>
          </div>

          <div className="med-card p-5">
            <h3 className="text-lg font-bold text-slate-950">Clinical timeline</h3>
            <div className="mt-4 space-y-3">
              {[
                ["Today", selected.next, "AI prepared documentation and care gap checklist."],
                ["May 12", "Medication reconciliation", "Two prescriptions renewed and sent to pharmacy."],
                ["Apr 28", "Outcome update", "Patient-reported symptoms improved from moderate to mild."],
              ].map(([date, title, detail]) => (
                <div key={date} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{title}</p>
                    <span className="text-xs font-bold text-slate-500">{date}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Action icon={MessageCircle} label="Message" />
            <Action icon={FileText} label="Note" />
            <Action icon={ShieldCheck} label="Eligibility" />
            <Action icon={Stethoscope} label="Refer" />
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Program icon={HeartPulse} title="Outcome tracking" detail="PROMIS score, disease registry, and CQM evidence are captured." />
        <Program icon={Activity} title="Remote monitoring" detail="Wearable and home-device readings sync into patient risk." />
        <Program icon={TrendingUp} title="Engagement AI" detail="Personalized reminders reduce no-show risk and close care gaps." />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Action({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <Icon size={16} /> {label}
    </button>
  );
}

function Program({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="med-card p-4">
      <Icon size={18} className="text-blue-700" />
      <p className="mt-3 font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
