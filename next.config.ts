import type { NextConfig } from "next";

// Video visits run in an iframe from Daily or Jitsi, which needs camera/mic access
const videoOrigins = [
  "https://*.daily.co",
  process.env.DAILY_DOMAIN ? `https://${process.env.DAILY_DOMAIN.replace(/^https?:\/\//, "")}` : null,
  `https://${process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"}`,
].filter(Boolean);
const mediaAllow = ["self", ...videoOrigins.map((o) => `"${o}"`)].join(" ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Camera and microphone for this site and the embedded video-visit provider
  { key: "Permissions-Policy", value: `camera=(${mediaAllow}), microphone=(${mediaAllow}), display-capture=(${mediaAllow}), geolocation=(), payment=(self)` },
];

const nextConfig: NextConfig = {
  experimental: {
    cpus: 2,
  },
  async redirects() {
    // "Make doctor" moved from Settings to the Users page
    return [{ source: "/super-admin/settings", destination: "/super-admin/users", permanent: false }];
  },
  async rewrites() {
    // An agent asking the homepage for Markdown gets the short Markdown version instead of HTML
    return {
      beforeFiles: [{ source: "/", has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }], destination: "/api/agent/markdown" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // RFC 8288 Link header: where an agent finds the machine-readable versions of the homepage
      {
        source: "/",
        headers: [
          { key: "Vary", value: "Accept" },
          {
            key: "Link",
            value: [
              '</llms.txt>; rel="describedby"; type="text/plain"',
              '</api/agent/markdown>; rel="alternate"; type="text/markdown"',
              '</sitemap.xml>; rel="sitemap"; type="application/xml"',
              '</.well-known/mcp/server-card.json>; rel="mcp-server-card"; type="application/json"',
            ].join(", "),
          },
        ],
      },
      // API responses carry patient data: never cache them
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
