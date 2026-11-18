/**
 * The tools the public MCP server (/api/mcp) offers. All are read-only and
 * return only what the website already shows anyone: verified doctors'
 * public profile, never patients, visits or accounts.
 */
import { supabaseAdmin } from './supabase-admin'
import { PUBLIC_PAGES, SITE, abs } from './site'

type Json = Record<string, unknown>
export type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean }

export const TOOLS = [
  {
    name: 'search_doctors',
    description: 'Search MedFlow’s verified doctors. Returns name, specialty, experience, consultation fee (INR), rating, languages and a booking link. Booking itself needs a signed-in patient.',
    inputSchema: {
      type: 'object',
      properties: {
        specialty: { type: 'string', description: 'Specialty to match, e.g. "Cardiology" or "Dermatology" (partial, case-insensitive).' },
        query: { type: 'string', description: 'Text to look for in the doctor’s name, clinic or bio.' },
        limit: { type: 'integer', minimum: 1, maximum: 25, default: 10, description: 'How many doctors to return.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'list_specialties',
    description: 'List the specialties that currently have verified doctors, with how many doctors each has.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_site_info',
    description: 'What MedFlow is, how booking and pricing work, and links to its public pages.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
] as const

type DoctorRow = {
  id: string
  specialty: string | null
  bio: string | null
  experience_years: number | null
  consultation_fee: number | null
  rating: number | null
  total_reviews: number | null
  clinic_name: string | null
  languages: string[] | null
  profiles?: { full_name: string } | { full_name: string }[] | null
}

async function verifiedDoctors(): Promise<DoctorRow[]> {
  const { data, error } = await supabaseAdmin
    .from('doctor_profiles')
    .select(`
      id,
      profile_id,
      is_verified,
      specialty,
      bio,
      experience_years,
      consultation_fee,
      rating,
      total_reviews,
      clinic_name,
      languages,
      profiles!doctor_profiles_profile_id_fkey (
        full_name
      )
    `)
    .eq('is_verified', true)
    .order('rating', { ascending: false })
  if (error) throw new Error('Doctors are temporarily unavailable')
  // Same rule as /api/doctors: a doctor whose account is gone is not listed
  return ((data ?? []) as DoctorRow[]).filter((d) => d.profiles !== null)
}

const nameOf = (d: DoctorRow) => (Array.isArray(d.profiles) ? d.profiles[0]?.full_name : d.profiles?.full_name) ?? 'Doctor'
const text = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] })
const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true })
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max).toLowerCase() : '')

/** Run one tool. Never throws: a bad call comes back as an isError result. */
export async function callTool(name: string, args: Json = {}): Promise<ToolResult> {
  try {
    if (name === 'search_doctors') {
      const specialty = clean(args.specialty, 60)
      const query = clean(args.query, 80)
      const limit = Math.min(25, Math.max(1, Number.isInteger(args.limit) ? (args.limit as number) : 10))
      const doctors = (await verifiedDoctors())
        .filter((d) => !specialty || (d.specialty ?? '').toLowerCase().includes(specialty))
        .filter((d) => !query || `${nameOf(d)} ${d.clinic_name ?? ''} ${d.bio ?? ''}`.toLowerCase().includes(query))
        .slice(0, limit)
        .map((d) => ({
          name: nameOf(d),
          specialty: d.specialty,
          experience_years: d.experience_years,
          consultation_fee_inr: d.consultation_fee,
          rating: d.total_reviews ? d.rating : null,
          reviews: d.total_reviews ?? 0,
          clinic: d.clinic_name,
          languages: d.languages ?? [],
          about: d.bio ? d.bio.slice(0, 300) : null,
          booking_link: abs(`/book/${d.id}`),
        }))
      return text({ count: doctors.length, doctors })
    }

    if (name === 'list_specialties') {
      const counts = new Map<string, number>()
      for (const d of await verifiedDoctors()) if (d.specialty) counts.set(d.specialty, (counts.get(d.specialty) ?? 0) + 1)
      return text({ specialties: [...counts].sort((a, b) => b[1] - a[1]).map(([specialty, doctors]) => ({ specialty, doctors })) })
    }

    if (name === 'get_site_info') {
      return text({
        name: SITE.name,
        description: SITE.description,
        url: SITE.url,
        pricing: 'Free for patients. Each visit costs the doctor’s own consultation fee, shown before booking; MedFlow adds no booking charge.',
        visit_types: ['in person', 'video', 'phone'],
        booking: 'Requires a signed-in patient account (web or Android app). Agents can search doctors but cannot book.',
        pages: PUBLIC_PAGES.map((p) => ({ title: p.title, url: abs(p.path) })),
        contact: { email: SITE.email, phone: SITE.phone },
      })
    }

    return fail(`Unknown tool: ${name}`)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'The tool failed')
  }
}
