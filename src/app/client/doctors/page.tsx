"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Search, Star, Video } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";

type Doctor = {
  id: string;
  specialty: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  experience_years: number;
  profiles: { full_name: string };
};

export default function DoctorsPage() {
  const { user, getToken } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/api/doctors')
      .then(r => r.json())
      .then(d => setDoctors(d.doctors ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(d =>
    `${d.profiles?.full_name} ${d.specialty}`.toLowerCase().includes(search.toLowerCase())
  );

  const hue = (name: string) => {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  };

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div>
          <div className="eyebrow">{loading ? "—" : `${filtered.length} specialists`}</div>
          <h1 className="h-1">Doctors</h1>
        </div>
        <div className="search" style={{ minWidth: 320 }}>
          <Search size={16} style={{ color: "var(--ink-3)" }} />
          <input placeholder="Search specialists..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass cell" style={{ height: 160, opacity: 0.4 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: "center" }}>
          <div className="h-3" style={{ marginBottom: 8 }}>No doctors found</div>
          <div className="small">Try a different search or check back later.</div>
        </div>
      ) : (
        <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {filtered.map(doctor => (
            <div key={doctor.id} className="glass cell doc-card">
              <div className="row gap-4">
                <Headshot name={doctor.profiles?.full_name ?? "?"} hue={hue(doctor.profiles?.full_name ?? "")} size={64} />
                <div>
                  <div className="h-4">{doctor.profiles?.full_name}</div>
                  <div className="small">{doctor.specialty}</div>
                  {doctor.rating > 0 && (
                    <div className="row gap-1" style={{ marginTop: 8, color: "var(--accent)" }}>
                      <Star size={12} fill="currentColor" />
                      <span className="tiny">{doctor.rating.toFixed(1)} · {doctor.total_reviews} reviews</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="row between" style={{ marginTop: 20 }}>
                <span className="pill">${doctor.consultation_fee}/visit</span>
                <a className="btn btn-primary btn-sm" href={`/client/book`}>
                  <Video size={12} /> Book
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
