/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    fetchCache: "force-no-store",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "maps.gstatic.com" },
    ],
  },
};

module.exports = nextConfig;
