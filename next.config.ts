import type { NextConfig } from "next";

/*
  Hosts allowed to serve product photography through next/image. Local files
  under public/ (e.g. /products/shirt.jpg) need no entry here — add a host only
  when photos are served from a CDN or object store, by setting IMAGE_HOSTS in
  .env to a comma-separated list. createProduct() in lib/admin/actions.ts
  validates against the same variable, so the two stay in step.
*/
const imageHosts = [
  "images.unsplash.com",
  ...(process.env.IMAGE_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [...new Set(imageHosts)].map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default nextConfig;
