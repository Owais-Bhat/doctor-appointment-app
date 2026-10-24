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
  async redirects() {
    // "Make doctor" moved from Settings to the Users page
    return [{ source: "/super-admin/settings", destination: "/super-admin/users", permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API responses carry patient data: never cache them
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
