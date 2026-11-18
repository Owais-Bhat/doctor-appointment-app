import { homeMarkdown } from '@/lib/agent-content'

/**
 * The homepage as Markdown. next.config.ts rewrites "/" here when the request
 * says Accept: text/markdown, so agents get a few hundred tokens instead of HTML.
 */
export function GET() {
  return new Response(homeMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept', 'Cache-Control': 'public, max-age=3600' },
  })
}
