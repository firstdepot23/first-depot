import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.13"],

  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;