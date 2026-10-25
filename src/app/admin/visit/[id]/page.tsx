"use client";

import { use } from "react";
import { VideoVisit } from "@/components/video/VideoVisit";

export default function DoctorVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <VideoVisit id={id} portal="doctor" />;
}
