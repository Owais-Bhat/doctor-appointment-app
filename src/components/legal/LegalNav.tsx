"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal";
import { cn } from "@/lib/utils";

/** Side list of policy pages (a scrollable row on phones), current page marked. */
export function LegalNav() {
  const path = usePathname();
  return (
    <nav className="lg-nav" aria-label="Policies">
      {LEGAL_PAGES.map((p) => (
        <Link key={p.href} href={p.href} className={cn("lg-nav-link", path === p.href && "on")} aria-current={path === p.href ? "page" : undefined}>
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
