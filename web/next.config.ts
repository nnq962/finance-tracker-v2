import type { NextConfig } from "next";
import packageJson from "./package.json";

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (see Dockerfile).
  output: "standalone",
  // The dev server's LAN addresses (DEV_LAN_HOSTS, the same list the dev
  // sign-in accepts) and this machine's dev tunnel (DEV_TUNNEL_HOST,
  // deploy/scripts/dev-tunnel.sh).
  allowedDevOrigins: [
    "192.168.2.100",
    ...(process.env.DEV_LAN_HOSTS ?? "").split(",").map((host) => host.trim()).filter(Boolean),
    ...(process.env.DEV_TUNNEL_HOST ? [process.env.DEV_TUNNEL_HOST] : []),
  ],
  experimental: {
    staleTimes: {
      dynamic: 300,
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  // Dev only: never cache. The dev tunnel goes through Cloudflare, which turns
  // the dev server's no-cache into a 4-hour browser cache; dev chunks keep
  // their URL across edits, so phones kept stale CSS. no-store it respects.
  //
  // Bank and wallet logos, everywhere: kept 30 days, then served from the
  // cache while it checks again, so a sheet's grid of logos never waits on
  // the network. Their names carry no hash: a redrawn logo takes a new name.
  // Last, so in dev it wins over the no-store above.
  //
  // Security, everywhere (2026-10-18): HTTPS only for a year (this host only,
  // not every nnqlab.dev name; production only, the dev server is plain http
  // on the LAN); no embedding by other sites (Firebase embeds /__/auth/iframe
  // from this same origin, so 'self' stays allowed); no MIME sniffing; the
  // full address only to this site; the microphone for this site (dictation)
  // and no camera or location. A full CSP that limits scripts would need a
  // nonce on each one; frame-ancestors, base-uri and object-src are the parts
  // that cannot break Google's sign in, Firebase or the push service worker.
  async headers() {
    const logos = {
      source: "/institutions/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=31536000" }],
    };
    const security = {
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
      ],
    };
    if (process.env.NODE_ENV !== "development") {
      security.headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
      return [security, logos];
    }

    return [
      security,
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      logos,
    ];
  },
  // Serve Firebase's OAuth helper from this domain, so Google Sign-In works
  // with NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN set to the app's own domain.
  async rewrites() {
    if (!firebaseProjectId) return [];

    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseProjectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
