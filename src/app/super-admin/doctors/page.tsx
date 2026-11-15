"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { AddDoctorForm } from "@/components/admin/AddDoctorForm";
import { DoctorReviewRow, type AdminDoctor } from "@/components/admin/DoctorReviewRow";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

type Filter = "waiting" | "verified" | "all";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "waiting", label: "Not verified" },
  { key: "verified", label: "Verified" },
  { key: "all", label: "All" },
];

export default function AdminDoctors() {
  const { data, loading, error, reload } = useApi<{ doctors: AdminDoctor[] }>("/api/super-admin/doctors");
  const [filter, setFilter] = useState<Filter>("waiting");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  const all = data?.doctors ?? [];
  const counts = { waiting: all.filter((d) => !d.is_verified).length, verified: all.filter((d) => d.is_verified).length, all: all.length };
  const list = all
    .filter((d) => (filter === "all" ? true : filter === "verified" ? d.is_verified : !d.is_verified))
    .filter((d) =>
      `${d.profiles?.full_name ?? ""} ${d.profiles?.email ?? ""} ${d.specialty} ${d.clinic_name ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
    );

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Doctors</h1>
          <p className="body">Only verified doctors appear in search and can be booked.</p>
        </div>
        {!adding && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setNotice(""); }}>
            <Plus size={15} /> Add doctor
          </button>
        )}
        <nav className="dr-tabs" aria-label="Filter doctors">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={cn("dr-tab", filter === f.key && "on")} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
              {f.label}
              {!loading && <span className="ad-n">{counts[f.key]}</span>}
            </button>
          ))}
        </nav>
      </header>

      {adding && (
        <AddDoctorForm
          onCancel={() => setAdding(false)}
          onAdded={(message) => {
            setAdding(false);
            setNotice(message);
            setFilter("verified");
            reload();
          }}
        />
      )}
      {notice && <p className="small" role="status">{notice}</p>}

      <label className="search" style={{ maxWidth: 520 }}>
        <Search size={16} className="mf-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, specialty or clinic" aria-label="Search doctors" />
      </label>

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 240, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Doctors could not be loaded</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">{query ? `No doctors match “${query}”` : filter === "waiting" ? "No doctors waiting" : "No doctors yet"}</p>
          <p className="small">Use “Add doctor” above, or “Make doctor” on the Users page for someone who already has an account.</p>
        </div>
      ) : (
        <ul className="ad-list">
          {list.map((d) => (
            <DoctorReviewRow key={d.id} doctor={d} onChanged={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}
