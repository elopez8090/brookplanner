import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/signup", destination: "/register", permanent: true },
      { source: "/vendors/category/:category", destination: "/vendors/:category", permanent: true },
      { source: "/vendors/category/:category/:borough", destination: "/vendors/:category/:borough", permanent: true },
    ];
  },
};

export default nextConfig;
