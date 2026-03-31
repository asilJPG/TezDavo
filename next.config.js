/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем кеш fetch глобально — все API routes всегда делают свежие запросы
  experimental: {
    fetchCache: "force-no-store",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
