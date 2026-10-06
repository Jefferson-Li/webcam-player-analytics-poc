/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@vladmandic/face-api"],
};

export default nextConfig;
