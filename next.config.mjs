/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: ".next-runtime",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  }
};

export default nextConfig;
