import { LEGAL, OPERATOR } from "@/lib/legal";

/** Operator and grievance contact details, as a definition list. */
export function ContactBlock({ grievance = true }: { grievance?: boolean }) {
  const rows: [string, React.ReactNode][] = [
    ["Operated by", OPERATOR],
  ];
  if (LEGAL.address) rows.push(["Address", LEGAL.address]);
  if (LEGAL.email) rows.push(["Email", <a key="e" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>]);
  if (LEGAL.phone) rows.push(["Phone", <a key="p" href={`tel:${LEGAL.phone.replace(/[^\d+]/g, "")}`}>{LEGAL.phone}</a>]);
  if (grievance) {
    rows.push([
      "Grievance officer",
      <>
        {LEGAL.grievanceName ?? "Grievance officer"}
        {LEGAL.grievanceEmail && <>, <a href={`mailto:${LEGAL.grievanceEmail}?subject=Grievance`}>{LEGAL.grievanceEmail}</a></>}
      </>,
    ]);
  }
  return (
    <dl className="lg-contact">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
