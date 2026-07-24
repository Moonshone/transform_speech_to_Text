import path from "node:path";

const ORT_BUNDLE = /(?:^|\/)ort\.bundle\.min(?:\.[\w-]+)?\.mjs$/;

class PreserveOrtModulePlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("PreserveOrtModulePlugin", (compilation) => {
      const { Compilation } = compiler.webpack;
      compilation.hooks.processAssets.tap(
        {
          name: "PreserveOrtModulePlugin",
          // Run immediately before JavaScript minimizers. Terser skips assets
          // whose metadata says that they have already been minimized.
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE - 1,
        },
        () => {
          for (const asset of compilation.getAssets()) {
            if (!ORT_BUNDLE.test(asset.name)) continue;
            compilation.updateAsset(asset.name, asset.source, {
              ...asset.info,
              minimized: true,
            });
          }
        },
      );
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    // Next's server build adds the `node` export condition, even while it
    // analyzes a client-side Web Worker. Transformers.js would therefore
    // resolve to transformers.node.mjs, which imports native-only modules such
    // as `sharp`. This worker must always use the browser distribution.
    config.resolve.alias["@huggingface/transformers$"] = path.resolve(
      process.cwd(),
      "node_modules/@huggingface/transformers/dist/transformers.web.js",
    );

    // Next.js represents its production minimizer as a lazy wrapper rather
    // than a TerserPlugin instance, so mutating minimizer.options does not work.
    // Mark only ONNX Runtime's already-minified module before that wrapper runs.
    if (!dev) config.plugins.push(new PreserveOrtModulePlugin());
    return config;
  },
};

export default nextConfig;
