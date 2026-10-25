"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { useApi, useAuthedFetch } from "@/lib/use-api";

type Profile = { profile: { phone: string | null; reminders_enabled?: boolean } };

/** Patient setting: text/WhatsApp reminders 24 hours and 1 hour before a visit. */
export function ReminderToggle() {
  const { data, loading } = useApi<Profile>("/api/patient/profile");
  const authedFetch = useAuthedFetch();
  const [override, setOverride] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const enabled = override ?? data?.profile.reminders_enabled ?? true;
  const phone = data?.profile.phone;

  const toggle = async (next: boolean) => {
    setOverride(next);
    setError("");
    try {
      await authedFetch("/api/patient/profile", { method: "PATCH", body: JSON.stringify({ reminders_enabled: next }) });
    } catch {
      setOverride(!next);
      setError("Couldn’t save that. Try again.");
    }
  };

  return (
    <div className="glass" style={{ padding: 24 }}>
      <div className="row gap-3" style={{ alignItems: "flex-start" }}>
        <BellRing size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
        <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
          <label className="sc-toggle" style={{ justifyContent: "space-between", width: "100%" }}>
            <span style={{ fontWeight: 600 }}>Text me visit reminders</span>
            <input type="checkbox" checked={enabled} disabled={loading} onChange={(e) => toggle(e.target.checked)} />
            <span className="sc-switch" aria-hidden="true" />
          </label>
          <p className="small">
            {phone
              ? `A day before and an hour before each confirmed visit, sent to ${phone}.`
              : "Add your phone number above to get reminders by text or WhatsApp."}{" "}
            Reminders in the app are always on.
          </p>
          {error && <p className="small sc-bad" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
