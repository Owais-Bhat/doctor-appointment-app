import { PUBLIC_PAGES, SITE, abs } from './site'

const pages = PUBLIC_PAGES.map((p) => `- [${p.title}](${abs(p.path)}): ${p.note}`).join('\n')
const contact = [SITE.email ? `Email: ${SITE.email}` : null, SITE.phone ? `Phone: ${SITE.phone}` : null].filter(Boolean).join(' · ')

const agentAccess = `## For agents

- MCP server (read-only, no sign-in): ${abs('/api/mcp')}, described at ${abs('/.well-known/mcp/server-card.json')}. Tools: \`search_doctors\`, \`list_specialties\`, \`get_site_info\`.
- Sitemap: ${abs('/sitemap.xml')}
- Booking, payments and health records need a signed-in patient account and are not available to agents.
- Content use: search and answering a person's question are fine; do not train models on this content (see ${abs('/robots.txt')}).`

/** /llms.txt: a short map of the site for language models (https://llmstxt.org). */
export function llmsTxt(): string {
  return `# ${SITE.name}

> ${SITE.description}

${SITE.name} connects patients with verified doctors. A patient searches doctors by specialty, picks an open time, and books an in-person, video or phone visit. Doctors confirm visits, write prescriptions and see patients’ intake details. The service is also available as an Android app.

## Pages

${pages}

${agentAccess}
${contact ? `\n## Contact\n\n${contact}\n` : ''}`
}

/** The homepage as Markdown, served when an agent asks for it with Accept: text/markdown. */
export function homeMarkdown(): string {
  return `# ${SITE.name} — ${SITE.tagline}

${SITE.description}

## How it works

1. **Find a doctor.** Search verified doctors by specialty, language and rating.
2. **Pick a time.** Choose an open slot for an in-person, video or phone visit.
3. **Visit.** The doctor confirms; you pay the doctor’s fee (no booking charge); video visits open in the app or browser.
4. **Afterwards.** Get your prescription, follow-up date and a way to rate the visit.

Patients get reminders by notification. Doctors manage their hours, requests and patients in their own portal.

## Pages

${pages}

${agentAccess}
${contact ? `\n## Contact\n\n${contact}\n` : ''}`
}
