import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf.js and its worker on disk — bundling breaks worker path resolution in API routes
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
