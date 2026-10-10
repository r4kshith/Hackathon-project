/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/*.node"],
  },
};

export default nextConfig;
