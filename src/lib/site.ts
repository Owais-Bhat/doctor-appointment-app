/**
 * What agents (and search engines) need to know about the site. One place, so
 * robots.txt, the sitemap, llms.txt, the JSON-LD and the MCP server card agree.
 */
const FALLBACK_URL = 'https://app.nestfy.in'

function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, '')
  // A localhost value left over from development must not leak into public files
  if (!raw || (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(raw))) return FALLBACK_URL
  return raw
}

/** Profiles that confirm this is the same business (JSON-LD sameAs). Comma-separated https URLs in NEXT_PUBLIC_SAME_AS. */
function sameAs(): string[] {
  return (process.env.NEXT_PUBLIC_SAME_AS ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter((u) => /^https:\/\/[^\s]+$/.test(u))
}

export const SITE = {
  name: 'MedFlow',
  url: siteUrl(),
  tagline: 'Book a doctor in person or on video',
  description:
    'MedFlow lets patients find a verified doctor, pick a time that suits them and see them in person, on a video call or by phone. Free for patients: you pay only the doctor’s consultation fee.',
  sameAs: sameAs(),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || null,
} as const

/** Public pages: what the sitemap lists and what llms.txt links to. */
export const PUBLIC_PAGES = [
  { path: '/', title: 'Home', note: 'What MedFlow is and how booking works', priority: 1 },
  { path: '/about', title: 'About us', note: 'Who runs MedFlow and how doctors are verified', priority: 0.7 },
  { path: '/pricing', title: 'Pricing', note: 'Free for patients; you pay only the doctor’s fee', priority: 0.8 },
  { path: '/contact', title: 'Contact us', note: 'Help with a visit, payment, refund or your data', priority: 0.6 },
  { path: '/refunds', title: 'Cancellations and refunds', note: 'When and how money comes back', priority: 0.5 },
  { path: '/privacy', title: 'Privacy policy', note: 'How health data is stored and used', priority: 0.5 },
  { path: '/terms', title: 'Terms of use', note: 'The rules for using MedFlow', priority: 0.4 },
  { path: '/shipping', title: 'Service delivery', note: 'How a visit is delivered', priority: 0.3 },
  { path: '/auth/register', title: 'Create an account', note: 'Free patient sign-up', priority: 0.6 },
] as const

export const abs = (path: string) => `${SITE.url}${path}`
