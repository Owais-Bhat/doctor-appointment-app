import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  Globe2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Video,
  WalletCards,
} from "lucide-react";

export const clinicStats = [
  { label: "Today queue", value: "38", change: "+6 vs avg", tone: "blue", icon: CalendarClock },
  { label: "Active patients", value: "1,284", change: "92% retained", tone: "teal", icon: Users },
  { label: "Revenue cycle", value: "$42.8k", change: "98 claims clean", tone: "amber", icon: WalletCards },
  { label: "Quality score", value: "96.4", change: "HEDIS ready", tone: "green", icon: ShieldCheck },
];

export const appointmentQueue = [
  {
    id: "APT-1048",
    patient: "Maya Chen",
    age: 34,
    time: "09:10",
    type: "Video",
    reason: "Follow-up, hypertension",
    status: "Checked in",
    risk: "Medium",
    payer: "Aetna PPO",
    ai: "BP trend up for 2 weeks. Ask about dizziness and adherence.",
  },
  {
    id: "APT-1051",
    patient: "Noah Williams",
    age: 8,
    time: "09:40",
    type: "Clinic",
    reason: "Fever and sore throat",
    status: "Room 3",
    risk: "Low",
    payer: "BlueCross",
    ai: "Rapid strep eligible. Parent consent on file.",
  },
  {
    id: "APT-1054",
    patient: "Ava Patel",
    age: 61,
    time: "10:20",
    type: "Video",
    reason: "Post-op wound check",
    status: "Ready",
    risk: "High",
    payer: "Medicare",
    ai: "Photo upload shows redness. Consider infection checklist.",
  },
  {
    id: "APT-1059",
    patient: "Liam Garcia",
    age: 45,
    time: "11:00",
    type: "Clinic",
    reason: "Diabetes review",
    status: "Pending intake",
    risk: "Medium",
    payer: "United",
    ai: "A1C overdue. Lab order draft prepared.",
  },
];

export const carePrograms = [
  { title: "Chronic care", patients: 214, adherence: 88, icon: HeartPulse },
  { title: "Remote monitoring", patients: 96, adherence: 74, icon: Activity },
  { title: "Post-discharge", patients: 41, adherence: 91, icon: Stethoscope },
];

export const phaseModules = [
  { phase: "Phase 2", title: "Enterprise operations", icon: Building2, items: ["Multi-clinic routing", "Insurance eligibility", "Revenue cycle", "Benchmark reports"] },
  { phase: "Phase 3", title: "Advanced intelligence", icon: Sparkles, items: ["AI scheduling", "Patient engagement", "Clinical outcomes", "Marketplace"] },
  { phase: "Phase 4", title: "Scale platform", icon: Globe2, items: ["Global compliance", "Enterprise SSO", "FHIR/EHR connectors", "Data warehouse"] },
];

export const insights = [
  { label: "No-show risk reduced", value: "18%", detail: "AI reminders and voice booking confirmations", icon: CheckCircle2 },
  { label: "Claims first-pass rate", value: "94%", detail: "EDI validation before submission", icon: FileText },
  { label: "Telehealth utilization", value: "42%", detail: "WebRTC consults with chat and recording workflow", icon: Video },
  { label: "Forecasted capacity", value: "+11 slots", detail: "Optimization found openings this week", icon: BarChart3 },
];

export const patients = [
  { name: "Maya Chen", age: 34, condition: "Hypertension", lastVisit: "Today", risk: "Medium", payer: "Aetna PPO", next: "Medication review" },
  { name: "Ava Patel", age: 61, condition: "Post-op follow-up", lastVisit: "May 16", risk: "High", payer: "Medicare", next: "Wound check" },
  { name: "Liam Garcia", age: 45, condition: "Type 2 diabetes", lastVisit: "May 12", risk: "Medium", payer: "United", next: "A1C lab" },
  { name: "Emma Thompson", age: 29, condition: "Asthma", lastVisit: "May 09", risk: "Low", payer: "Cigna", next: "Peak flow review" },
];

export const weeklySlots = [
  { day: "Mon", open: "08:30", close: "17:00", booked: 31, capacity: 36 },
  { day: "Tue", open: "09:00", close: "18:00", booked: 29, capacity: 34 },
  { day: "Wed", open: "08:30", close: "16:30", booked: 24, capacity: 30 },
  { day: "Thu", open: "10:00", close: "19:00", booked: 33, capacity: 36 },
  { day: "Fri", open: "08:30", close: "15:00", booked: 21, capacity: 26 },
];
