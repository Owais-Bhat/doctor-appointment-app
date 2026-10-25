import { notFound } from "next/navigation";

export const metadata = { title: "Components · MedFlow", robots: { index: false } };

/** Developer-only gallery of UI primitives: not served in production. */
export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
