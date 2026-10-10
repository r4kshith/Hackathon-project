/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};

export default nextConfig;
