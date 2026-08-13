import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  allowedDevOrigins: ["*.ngrok-free.app", "localhost:3000", "*.lhr.life", "*.loca.lt"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://web.telegram.org https://telegram.org;",
          },
          {
            key: "ngrok-skip-browser-warning",
            value: "true",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static', 'tesseract.js', '@tensorflow/tfjs-node', 'exif-parser', 'sharp', 'heic-convert', 'piscina', 'child_process'],
};

export default withNextIntl(nextConfig);
