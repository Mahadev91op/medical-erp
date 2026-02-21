// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Wapas inko root level par rakhein (experimental se bahar)
  reactCompiler: true,
  turbopack: {}, 
  
  // Cross-origin network dev error ko chupane ke liye (Optional but recommended)
  experimental: {
    allowedDevOrigins: ["localhost:3000", "10.89.231.77:3000"]
  }
};

export default withPWA(nextConfig);