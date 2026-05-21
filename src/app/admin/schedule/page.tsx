"use client";

import { useState } from "react";
import { CalendarClock, LockKeyhole, Plus, Sparkles, Trash2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MedFlowVoiceAssistant } from "@/components/MedFlowVoiceAssistant";
import { weeklySlots } from "@/lib/medflow-data";

export default function SchedulePage() {
  const [slots, setSlots] = useState(weeklySlots);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-blue-700">Capacity management</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">Smart schedule control</h1>
        <p className="mt-2 text-sm text-slate-600">Weekly templates, blocked dates, AI optimization, and multi-clinic capacity rules.</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="med-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Weekly availability</h2>
              <p className="text-sm text-slate-500">Adjust hours and capacity without losing the operational view.</p>
            </div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white">
              <Plus size={16} /> Add block
            </button>
          </div>

          <div className="space-y-3">
            {slots.map((slot, index) => {
              const utilization = Math.round((slot.booked / slot.capacity) * 100);
              return (
                <div key={slot.day} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="grid gap-4 lg:grid-cols-[80px_1fr_160px] lg:items-center">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{slot.day}</p>
                      <p className="text-xs text-slate-500">{utilization}% used</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-xs font-bold uppercase text-slate-500">Open</span>
                        <input
                          type="time"
                          value={slot.open}
                          onChange={(event) => {
                            const next = [...slots];
                            next[index] = { ...slot, open: event.target.value };
                            setSlots(next);
                          }}
                          className="mt-1 w-full border-0 bg-transparent text-sm font-semibold outline-none"
                        />
                      </label>
                      <label className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="text-xs font-bold uppercase text-slate-500">Close</span>
                        <input
                          type="time"
                          value={slot.close}
                          onChange={(event) => {
                            const next = [...slots];
                            next[index] = { ...slot, close: event.target.value };
                            setSlots(next);
                          }}
                          className="mt-1 w-full border-0 bg-transparent text-sm font-semibold outline-none"
                        />
                      </label>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>{slot.booked} booked</span>
                        <span>{slot.capacity} max</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${utilization}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-5">
          <MedFlowVoiceAssistant />

          <div className="med-card p-5">
            <h2 className="text-lg font-bold text-slate-950">Optimization plan</h2>
            <div className="mt-4 space-y-3">
              <Optimization icon={Sparkles} title="Open 11 high-value slots" detail="AI found recurring gaps across video follow-ups and chronic care check-ins." />
              <Optimization icon={Users} title="Balance clinic load" detail="Move two low-acuity visits to telehealth to free room capacity." />
              <Optimization icon={LockKeyhole} title="Respect constraints" detail="Provider PTO, payer rules, visit type, and patient preferences are enforced." />
            </div>
          </div>

          <div className="med-card p-5">
            <h2 className="text-lg font-bold text-slate-950">Blocked dates</h2>
            <div className="mt-4 space-y-3">
              {["May 27 - CME Conference", "Jun 04 - Surgery coverage", "Jun 19 - Regional holiday"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarClock size={16} className="text-slate-500" /> {item}
                  </div>
                  <button className="text-slate-400 hover:text-rose-600" aria-label={`Remove ${item}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Optimization({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 font-semibold text-slate-950">
        <Icon size={17} className="text-blue-700" /> {title}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}
