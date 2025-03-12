/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // ESLint hatalarının build işlemini durdurmayacağını belirtiyoruz
      ignoreDuringBuilds: true,
    },
    typescript: {
      // TypeScript hatalarının build işlemini durdurmayacağını belirtiyoruz
      ignoreBuildErrors: true,
    },
  };
  
  module.exports = nextConfig;