import type { NextConfig } from "next";

// On Vercel we use the standard Next.js build output (not standalone).
// Locally / self-hosted we can use standalone for the `start` script.
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const nextConfig: NextConfig = {
  // Vercel handles output itself; only use standalone for self-hosted.
  ...(isVercel ? {} : { output: "standalone" }),
  // Prisma must be externalized from the serverless bundle (it uses native
  // binaries that can't be bundled).
  serverExternalPackages: ["@prisma/client"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
