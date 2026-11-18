"use client";

import { useState } from "react";
import { FileImage, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Opens an uploaded report in a new tab. The file route needs the sign-in
 * token, which a plain link cannot send, so the file is fetched first and
 * shown from a temporary browser URL.
 */
export function ReportLink({ id, title, mime }: { id: string; title: string; mime: string }) {
  const { getToken } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const Icon = mime === "application/pdf" ? FileText : FileImage;

  const open = async () => {
    // Open the tab inside the click, or the browser blocks it as a pop-up
    const tab = window.open("", "_blank");
    setState("loading");
    try {
      const token = await getToken();
      const res = await fetch(`/api/reports/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setState("idle");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab?.close();
      setState("error");
    }
  };

  return (
    <button type="button" className="vrow-link" onClick={open} disabled={state === "loading"} title={state === "error" ? "Couldn’t open this file. Try again." : undefined}>
      <Icon size={14} /> {state === "loading" ? "Opening…" : state === "error" ? "Couldn’t open. Retry" : title}
    </button>
  );
}
