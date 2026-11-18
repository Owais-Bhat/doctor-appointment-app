'use client';

import { useEffect } from 'react';

/**
 * WebMCP (https://webmachinelearning.github.io/webmcp/): tools a browser agent
 * can call on this page through navigator.modelContext. Read-only searches plus
 * moving to a public page; nothing here signs in, books or changes data.
 */
type ToolResult = { content: { type: 'text'; text: string }[] };
type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};
type ModelContext = { registerTool?: (tool: Tool) => unknown; unregisterTool?: (name: string) => void };

const ok = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] });

/** Pages an agent may open for the person: public ones and the sign-in/booking entrances. */
const PAGES: Record<string, string> = {
  home: '/',
  about: '/about',
  pricing: '/pricing',
  contact: '/contact',
  refunds: '/refunds',
  privacy: '/privacy',
  terms: '/terms',
  sign_in: '/auth/login',
  create_account: '/auth/register',
  find_a_doctor: '/client/doctors',
};

type Doctor = { id: string; specialty: string | null; consultation_fee: number | null; rating: number | null; total_reviews: number | null; clinic_name: string | null; experience_years: number | null; profiles: { full_name: string } | null };

const TOOLS: Tool[] = [
  {
    name: 'search_doctors',
    description: 'Search MedFlow’s verified doctors by specialty or name. Returns name, specialty, fee in INR, rating and a link to book (booking needs the person to sign in).',
    inputSchema: {
      type: 'object',
      properties: {
        specialty: { type: 'string', description: 'e.g. Cardiology, Dermatology (partial match).' },
        query: { type: 'string', description: 'Part of a doctor’s name or clinic.' },
      },
    },
    annotations: { readOnlyHint: true },
    async execute(args) {
      const res = await fetch('/api/doctors');
      const body = (await res.json()) as { doctors?: Doctor[] };
      const specialty = String(args.specialty ?? '').trim().toLowerCase();
      const query = String(args.query ?? '').trim().toLowerCase();
      const found = (body.doctors ?? [])
        .filter((d) => !specialty || (d.specialty ?? '').toLowerCase().includes(specialty))
        .filter((d) => !query || `${d.profiles?.full_name ?? ''} ${d.clinic_name ?? ''}`.toLowerCase().includes(query))
        .slice(0, 10)
        .map((d) => ({ name: d.profiles?.full_name, specialty: d.specialty, fee_inr: d.consultation_fee, rating: d.total_reviews ? d.rating : null, clinic: d.clinic_name, book: `${location.origin}/book/${d.id}` }));
      return ok({ count: found.length, doctors: found });
    },
  },
  {
    name: 'open_page',
    description: `Take the person to a page of this site. Options: ${Object.keys(PAGES).join(', ')}.`,
    inputSchema: { type: 'object', properties: { page: { type: 'string', enum: Object.keys(PAGES) } }, required: ['page'] },
    async execute(args) {
      const path = PAGES[String(args.page)];
      if (!path) return ok(`Unknown page. Use one of: ${Object.keys(PAGES).join(', ')}`);
      location.assign(path);
      return ok(`Opening ${path}`);
    },
  },
  {
    name: 'get_site_info',
    description: 'What MedFlow is and how pricing and booking work.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      return ok('MedFlow lets patients find verified doctors and book in-person, video or phone visits. Free for patients: you pay only the doctor’s fee. Booking needs a patient account. Machine-readable summary: /llms.txt');
    },
  },
];

export function WebMcp() {
  useEffect(() => {
    const ctx = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!ctx?.registerTool) return;
    const names: string[] = [];
    for (const tool of TOOLS) {
      try {
        ctx.registerTool(tool);
        names.push(tool.name);
      } catch {
        // Already registered (e.g. a hot reload) or refused: the page works without it
      }
    }
    return () => {
      for (const n of names) {
        try {
          ctx.unregisterTool?.(n);
        } catch {
          // nothing to undo
        }
      }
    };
  }, []);
  return null;
}
