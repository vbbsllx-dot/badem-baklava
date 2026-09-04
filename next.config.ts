import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // يمنع سيرفر Next.js من محاولة معالجة الصور ويعتمد على الـ WebP الجاهز من كود الرفع الخاص بك
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zpvcjdnucykexfnxkxeb.supabase.co",
      },
    ],
  },
};

export default nextConfig;