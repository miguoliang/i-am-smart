import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import createMDX from "@next/mdx";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Load .env.local from monorepo root so local dev reads the same env as the root
try {
  const rootEnv = path.join(__dirname, "../../.env.local");
  require("dotenv").config({ path: rootEnv });
} catch {
  // dotenv optional; apps/pwa/.env* are still loaded by Next.js
}

const { version } = require("./package.json") as { version: string };

// Use string references for plugins to ensure serializable options
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-pretty-code"],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Required for monorepo: trace files up to the repo root
  outputFileTracingRoot: path.join(__dirname, "../../"),
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/signin",
        permanent: true,
      },
      {
        source: "/pricing",
        destination: "/#pricing",
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.js',
    };
    return config;
  },
};

// Conditionally apply Serwist only if not disabled
const isSWDisabled = process.env.DISABLE_SW === "true";

export default isSWDisabled
  ? withMDX(nextConfig)
  : withSerwistInit({
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
    })(withMDX(nextConfig));
