/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { isServer }) => {
    // Fix for canvas issue in browser
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }

    return config;
  },
  // Prevent Next.js from bundling these packages (they contain native binaries)
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "puppeteer"],
};

export default nextConfig;
