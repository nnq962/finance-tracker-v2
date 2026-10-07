import type { NextConfig } from "next";
import packageJson from "./package.json";

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (see Dockerfile).
  output: "standalone",
  // The dev server's LAN address, and the dev tunnel (deploy/scripts/dev-tunnel.sh).
  allowedDevOrigins: ["192.168.2.100", "finance-dev.nnqlab.dev"],
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
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];

    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
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
