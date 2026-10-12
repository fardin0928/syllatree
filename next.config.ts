import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build for Docker (see Dockerfile)
  output: "standalone",
  turbopack: { root: path.resolve(__dirname) },
  devIndicators: false,
  images: {
    // Google account avatars
    remotePatterns: [{ protocol: "https", hostname: "*.googleusercontent.com" }],
  },
};

export default nextConfig;
