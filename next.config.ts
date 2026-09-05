import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // السماح بنطاق صور سوبابيس الخاص بك لتجنب أخطاء التحميل
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zpvcjdnucykexfnxkxeb.supabase.co",
      },
    ],
    qualities: [75, 80, 85],
  },
};

export default nextConfig;