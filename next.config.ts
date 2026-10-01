import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.70.22.33"],
  experimental: {
    staleTimes: {
      dynamic: 300,
    },
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
