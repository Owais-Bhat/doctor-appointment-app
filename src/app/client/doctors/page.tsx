"use client";

import { Search, Star, Video } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";

const doctors = ["Dr. Sarah Jenkins", "Dr. Marcus Chen", "Dr. Aisha Okafor", "Dr. Lukas Bergstrom", "Dr. Priya Raghavan", "Dr. Henrik Klein"];

export default function DoctorsPage() {
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div><div className="eyebrow">Specialists</div><h1 className="h-1">Doctors</h1></div>
        <div className="search" style={{ minWidth: 320 }}><Search size={16} /><input placeholder="Search specialists..." /></div>
      </div>
      <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {doctors.map((doctor, index) => (
          <div key={doctor} className="glass cell doc-card">
            <div className="row gap-4">
              <Headshot name={doctor} hue={(index * 55 + 140) % 360} size={64} />
              <div>
                <div className="h-4">{doctor}</div>
                <div className="small">{["Cardiology", "Neurology", "General Med", "Orthopedics", "Dermatology", "Pulmonology"][index]}</div>
                <div className="row gap-1" style={{ marginTop: 8, color: "var(--accent)" }}><Star size={12} fill="currentColor" /> <span className="tiny">4.{9 - (index % 3)} · {200 + index * 71} reviews</span></div>
              </div>
            </div>
            <div className="row between" style={{ marginTop: 20 }}>
              <span className="pill good"><Video size={11} /> Today</span>
              <a className="btn btn-primary btn-sm" href={`/client/doctors/${index + 1}`}>View</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
