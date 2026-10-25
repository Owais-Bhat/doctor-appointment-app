import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal";

/** Links to every policy page, for page footers. */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Policies" className={className}>
      {LEGAL_PAGES.map((p) => (
        <Link key={p.href} href={p.href}>{p.label}</Link>
      ))}
    </nav>
  );
}
