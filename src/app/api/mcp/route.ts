/**
 * MedFlow's public MCP server (Model Context Protocol, Streamable HTTP, JSON
 * responses, stateless). Read-only tools over public information; see
 * lib/agent-tools.ts. Described by /.well-known/mcp/server-card.json.
 */
import { callTool, TOOLS } from '@/lib/agent-tools'
import { checkRateLimit } from '@/lib/middleware/rateLimiter'
import { SITE } from '@/lib/site'

const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05']
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Max-Age': '86400',
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...CORS, 'Cache-Control': 'no-store' } })
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }

/** Answer one JSON-RPC message; null for notifications, which get no answer. */
async function handle(msg: Rpc): Promise<unknown | null> {
  if (msg?.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid request')
  const isNotification = msg.id === undefined
  const reply = (result: unknown) => (isNotification ? null : { jsonrpc: '2.0', id: msg.id, result })

  switch (msg.method) {
    case 'initialize': {
      const asked = msg.params?.protocolVersion
      return reply({
        protocolVersion: typeof asked === 'string' && SUPPORTED.includes(asked) ? asked : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'medflow', title: SITE.name, version: '1.0.0' },
        instructions: 'Read-only information about MedFlow and its verified doctors. Booking needs a signed-in patient and is not available here.',
      })
    }
    case 'ping':
      return reply({})
    case 'tools/list':
      return reply({ tools: TOOLS })
    case 'tools/call': {
      const name = msg.params?.name
      if (typeof name !== 'string' || !TOOLS.some((t) => t.name === name)) return isNotification ? null : rpcError(msg.id, -32602, 'Unknown tool')
      const args = msg.params?.arguments
      return reply(await callTool(name, args && typeof args === 'object' && !Array.isArray(args) ? (args as Record<string, unknown>) : {}))
    }
    default:
      // notifications/initialized, notifications/cancelled … need no answer
      if (msg.method.startsWith('notifications/')) return null
      return isNotification ? null : rpcError(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

/** Server-to-client streaming is not offered; clients use POST only. */
export function GET() {
  return new Response('This MCP server answers POST requests only.', { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } })
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = checkRateLimit(`mcp:${ip}`, { windowMs: 60_000, maxRequests: 60 })
  if (!limit.success) return json(rpcError(null, -32000, 'Too many requests. Please wait a minute.'), 429)

  const body = await request.json().catch(() => undefined)
  if (body === undefined) return json(rpcError(null, -32700, 'Parse error'), 400)

  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 20) return json(rpcError(null, -32600, 'Send between 1 and 20 messages'), 400)
    const answers = (await Promise.all(body.map((m) => handle(m)))).filter((a) => a !== null)
    return answers.length ? json(answers) : new Response(null, { status: 202, headers: CORS })
  }

  const answer = await handle(body)
  return answer === null ? new Response(null, { status: 202, headers: CORS }) : json(answer)
}
