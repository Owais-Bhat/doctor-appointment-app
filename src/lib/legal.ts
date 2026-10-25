/**
 * Business details shown on the legal pages (privacy, terms, refunds…).
 * Set these in .env before going live — Razorpay and India's DPDP Act
 * expect a real legal name, address and a named grievance contact.
 */
const env = (v: string | undefined) => (v && v.trim() ? v.trim() : null)

export const LEGAL = {
  brand: 'MedFlow',
  /** Registered name of the business that runs the site, e.g. "MedFlow Health Pvt. Ltd." */
  legalName: env(process.env.NEXT_PUBLIC_LEGAL_NAME),
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS),
  email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  phone: env(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  /** Person who answers privacy requests and complaints (DPDP Act: grievance officer) */
  grievanceName: env(process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER),
  grievanceEmail: env(process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL) ?? env(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  /** Courts named in the terms, e.g. "Srinagar, Jammu and Kashmir" */
  jurisdiction: env(process.env.NEXT_PUBLIC_LEGAL_JURISDICTION),
  /** When these policies last changed */
  updated: '25 October 2026',
} as const

/** The operator's name as it should read in a sentence. */
export const OPERATOR = LEGAL.legalName ?? LEGAL.brand

/** "MedFlow is run by X." — or nothing when no separate legal name is set. */
export const RUN_BY = LEGAL.legalName ? `MedFlow is run by ${LEGAL.legalName.replace(/\.$/, '')}.` : ''

/** Details still missing; shown as a warning on the legal pages outside production. */
export function missingLegalDetails(): string[] {
  const out: string[] = []
  if (!LEGAL.legalName) out.push('NEXT_PUBLIC_LEGAL_NAME')
  if (!LEGAL.address) out.push('NEXT_PUBLIC_LEGAL_ADDRESS')
  if (!LEGAL.email) out.push('NEXT_PUBLIC_CONTACT_EMAIL')
  if (!LEGAL.phone) out.push('NEXT_PUBLIC_CONTACT_PHONE')
  if (!LEGAL.grievanceName) out.push('NEXT_PUBLIC_GRIEVANCE_OFFICER')
  if (!LEGAL.jurisdiction) out.push('NEXT_PUBLIC_LEGAL_JURISDICTION')
  return out
}

export const LEGAL_PAGES = [
  { href: '/about', label: 'About us' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact us' },
  { href: '/terms', label: 'Terms of use' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/refunds', label: 'Cancellations & refunds' },
  { href: '/shipping', label: 'Service delivery' },
] as const
