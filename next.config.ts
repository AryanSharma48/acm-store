import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Allow all Unsplash images (used by product cards and checkout summary)
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Allow Cloudinary images (used by new products)
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
