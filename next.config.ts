import type { NextConfig } from "next";

// you can change this to whatever free host you deploy to (Vercel/Netlify/etc.)
// e.g. sunwayconnect.vercel.app or sunwayconnect.netlify.app
const DEFAULT_DOMAIN = "https://sunwayconnect.vercel.app";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_DOMAIN,
  },
};

export default nextConfig;
