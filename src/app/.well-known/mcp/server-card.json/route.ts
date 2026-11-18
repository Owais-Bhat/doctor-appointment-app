import { TOOLS } from '@/lib/agent-tools'
import { SITE, abs } from '@/lib/site'

/** MCP Server Card (SEP-1649): how an agent finds and talks to the MCP server at /api/mcp. */
export function GET() {
  const card = {
    $schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
    version: '1.0.0',
    name: 'medflow',
    title: SITE.name,
    description: `Read-only information about ${SITE.name} and its verified doctors: search doctors, list specialties, site and pricing info.`,
    protocolVersion: '2025-06-18',
    serverInfo: { name: 'medflow', title: SITE.name, version: '1.0.0' },
    endpoint: abs('/api/mcp'),
    transport: { type: 'streamable-http', endpoint: abs('/api/mcp') },
    capabilities: { tools: { listChanged: false } },
    authentication: { required: false },
    documentationUrl: abs('/llms.txt'),
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
  }
  return Response.json(card, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } })
}
