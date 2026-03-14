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
  // reactCompiler ko hamesha experimental ke andar rakhna hota hai
  experimental: {
    reactCompiler: true,
    allowedDevOrigins: ["localhost:3000", "10.89.231.77:3000"]
  }
  turbopack: {}
};

export default withPWA(nextConfig);