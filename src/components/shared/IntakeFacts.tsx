import { Clock3, Pill, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type IntakeData = { duration?: string | null; severity?: string | null; medications?: string | null; allergies?: string | null } | null | undefined;

const SEVERITY_LABEL: Record<string, string> = { mild: "Mild", moderate: "Moderate", severe: "Severe" };

/** What the patient told us before the visit, for the doctor. Renders nothing when empty. */
export function IntakeFacts({ intake, hideAllergies = false }: { intake: IntakeData; hideAllergies?: boolean }) {
  if (!intake) return null;
  const { duration, severity, medications, allergies } = intake;
  if (!duration && !severity && !medications && !(allergies && !hideAllergies)) return null;
  return (
    <ul className="ikf" aria-label="Patient’s pre-visit details">
      {severity && SEVERITY_LABEL[severity] && (
        <li className={cn("ikf-sev", `sev-${severity}`)}>{SEVERITY_LABEL[severity]}</li>
      )}
      {duration && <li><Clock3 size={13} /> {duration}</li>}
      {medications && <li><Pill size={13} /> {medications}</li>}
      {allergies && !hideAllergies && <li className="ikf-allergy"><TriangleAlert size={13} /> Allergies: {allergies}</li>}
    </ul>
  );
}
