import { SITE, abs } from '@/lib/site'

/**
 * /robots.txt. A route handler (not app/robots.ts) because that file type
 * cannot carry the Content-Signal line (https://contentsignals.org).
 *
 * Content signals: show the site in search and let agents read it to answer
 * a person's question, but do not train models on it.
 */
export function GET() {
  const body = [
    `# ${SITE.name} — ${SITE.tagline}`,
    '# Summary for agents: /llms.txt',
    '',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    'Allow: /api/agent/',
    'Allow: /api/mcp',
    '# Signed-in areas and the private API',
    'Disallow: /client/',
    'Disallow: /admin/',
    'Disallow: /super-admin/',
    'Disallow: /api/',
    '',
    `Sitemap: ${abs('/sitemap.xml')}`,
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
