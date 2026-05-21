"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, FileText, MessageSquare, PhoneCall, Search, ShieldCheck, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MedFlowVoiceAssistant } from "@/components/MedFlowVoiceAssistant";
import { appointmentQueue } from "@/lib/medflow-data";
import { cn } from "@/lib/utils";

const stages = ["Pending intake", "Checked in", "Room 3", "Ready", "Completed"];

export default function AppointmentKanban() {
  const [selected, setSelected] = useState(appointmentQueue[0]);
  const [query, setQuery] = useState("");
  const filtered = appointmentQueue.filter((item) =>
    `${item.patient} ${item.reason} ${item.payer}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Appointment operations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">AI-assisted visit pipeline</h1>
          <p className="mt-2 text-sm text-slate-600">Voice booking, intake status, eligibility, and clinician preparation in one place.</p>
        </div>
        <div className="flex w-full rounded-md border border-slate-200 bg-white lg:w-96">
          <Search className="ml-3 mt-3 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search queue"
            className="min-w-0 flex-1 rounded-md border-0 px-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="med-card overflow-hidden">
          <div className="grid min-w-[900px] grid-cols-5 border-b border-slate-200 bg-slate-50">
            {stages.map((stage) => (
              <div key={stage} className="border-r border-slate-200 px-4 py-3 last:border-r-0">
                <p className="text-xs font-bold uppercase text-slate-500">{stage}</p>
                <p className="text-xs text-slate-400">{filtered.filter((item) => item.status === stage).length} visits</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-5 gap-0">
              {stages.map((stage) => (
                <div key={stage} className="min-h-[560px] space-y-3 border-r border-slate-200 bg-white p-3 last:border-r-0">
                  {filtered
                    .filter((item) => item.status === stage)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className={cn(
                          "w-full rounded-md border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50",
                          selected.id === item.id ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{item.patient}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.id}</p>
                          </div>
                          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{item.time}</span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-slate-600">{item.reason}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                            {item.type === "Video" ? <Video size={12} /> : <PhoneCall size={12} />}
                            {item.type}
                          </span>
                          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{item.risk}</span>
                        </div>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <MedFlowVoiceAssistant />

          <div className="med-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Selected visit</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{selected.patient}</h2>
                <p className="text-sm text-slate-500">{selected.reason}</p>
              </div>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{selected.status}</span>
            </div>

            <div className="mt-5 grid gap-3">
              <Detail icon={Clock3} label="Time" value={`${selected.time}, today`} />
              <Detail icon={ShieldCheck} label="Eligibility" value={`${selected.payer} verified`} />
              <Detail icon={FileText} label="Clinical prep" value={selected.ai} />
              <Detail icon={MessageSquare} label="Engagement" value="SMS, email, and portal reminders queued" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white">
                <Video size={16} /> Start
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 size={16} /> Complete
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        <Icon size={14} /> {label}
      </div>
      <p className="text-sm leading-5 text-slate-700">{value}</p>
    </div>
  );
}
