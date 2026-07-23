import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Next's server build adds the `node` export condition, even while it
    // analyzes a client-side Web Worker. Transformers.js would therefore
    // resolve to transformers.node.mjs, which imports native-only modules such
    // as `sharp`. This worker must always use the browser distribution.
    config.resolve.alias["@huggingface/transformers$"] = path.resolve(
      process.cwd(),
      "node_modules/@huggingface/transformers/dist/transformers.web.js",
    );
    return config;
  },
};

export default nextConfig;
