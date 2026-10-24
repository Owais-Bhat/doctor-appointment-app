"use client";

import { use } from "react";
import { VideoVisit } from "@/components/video/VideoVisit";

export default function PatientVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <VideoVisit id={id} portal="patient" />;
}
