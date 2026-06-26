import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org + project are read from SENTRY_ORG and SENTRY_PROJECT env vars
  // Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (CI/CD)
  silent: true,
});
