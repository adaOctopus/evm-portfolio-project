import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hardhat directories (artifacts, cache, typechain-types) are already in .gitignore
  // Next.js should ignore them automatically, but if you see filesystem errors,
  // you can temporarily disable Turbopack by running: next dev -- --no-turbo
};

export default nextConfig;
