import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.5"],
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
