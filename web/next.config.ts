import type { NextConfig } from "next";
import packageJson from "./package.json";

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (see Dockerfile).
  output: "standalone",
  // The LAN address, and the dev tunnel (deploy/scripts/dev-tunnel.sh).
  allowedDevOrigins: ["10.70.22.33", "dev.nnqlab.dev"],
  experimental: {
    staleTimes: {
      dynamic: 300,
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
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
