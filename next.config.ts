import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-map-gl", "mapbox-gl"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "bottledtalk.com" }],
        destination: "https://www.bottledtalk.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
